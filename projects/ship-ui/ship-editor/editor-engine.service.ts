import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { BaseBlockBehavior, BaseInlineBehavior, SlashCommand } from './editor-behaviors';
import { astToHtml, astToMarkdown } from './editor-serializers';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { ColumnarDocument, RowKind, fromColumnar, toColumnar } from './editor-columnar';
import {
  ColumnarMutation,
  backspaceOp,
  blockFromRow,
  deleteBlockOp,
  deleteForwardOp,
  deleteRangeOp,
  enterOp,
  escapeHatchOp,
  flatPosAt,
  insertImageOp,
  insertFragmentOp,
  insertTextOp,
  pointAt,
  replaceBlocksOp,
  rootRowOf,
  setBlockTypeOp,
  toggleMarkOp,
  topLevelCount,
} from './editor-columnar-mutations';
import { applyOpToColumnar } from './editor-columnar-ops';
import { EditorOp, EditorTransaction, applyOp, diffDocuments, invertOp, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTMark, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';

@Injectable()
export class EditorEngineService {
  readonly selection = inject(EditorSelectionService);

  /**
   * The document. Columnar is the only live model: every mutation is a row
   * operation on it, and the op each mutation returns feeds history and
   * collaboration. There is no maintained nested tree any more.
   */
  #columnar: ColumnarDocument = toColumnar([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);

  get columnar(): ColumnarDocument {
    return this.#columnar;
  }

  /**
   * The nested AST, materialized from the columnar document on demand and
   * cached per version. Nothing on the editing path reads this — rendering
   * and serialization run from rows — so a document that is only being typed
   * into never materializes a tree. External readers (and specs) get the
   * familiar shape at the cost of one `fromColumnar` per version read.
   */
  readonly document: Signal<ASTDocument> = computed(() => {
    this.version();
    return fromColumnar(this.#columnar);
  });

  /** Replace the content wholesale without recording a transaction. */
  load(doc: ASTDocument) {
    this.#columnar = toColumnar(doc);
    this.#markAllDirty();
    this.version.update((v) => v + 1);
  }

  // -------------------------------------------------------------------------
  // Render bookkeeping: which top-level blocks changed since the DOM last
  // looked, plus a per-block HTML cache shared by patchDOM and serialize.
  // -------------------------------------------------------------------------

  #htmlCache: (string | undefined)[] = [];
  #dirtyBlocks = new Set<number>();
  /** Suffix threshold: indices at or past this shifted structurally. */
  #dirtyFrom = 0;

  #noteOp(op: EditorOp) {
    if (op.kind === 'inline') {
      this.#dirtyBlocks.add(op.blockIndex);
      this.#htmlCache[op.blockIndex] = undefined;
    } else {
      this.#dirtyFrom = Math.min(this.#dirtyFrom, op.at);
      // The suffix shifts but its content is unchanged; splicing keeps those
      // blocks' rendered HTML reusable at their new indices.
      this.#htmlCache.splice(op.at, op.removed.length, ...new Array<string | undefined>(op.inserted.length).fill(undefined));
    }
  }

  #markAllDirty() {
    this.#dirtyFrom = 0;
    this.#dirtyBlocks.clear();
    this.#htmlCache = [];
  }

  /** Blocks the DOM must re-check, consumed by the render pass. */
  consumeRenderDirty(): { blocks: Set<number>; from: number } {
    const out = { blocks: this.#dirtyBlocks, from: this.#dirtyFrom };
    this.#dirtyBlocks = new Set();
    this.#dirtyFrom = Number.MAX_SAFE_INTEGER;
    return out;
  }

  /** Rendered HTML of one top-level block, from the cache when clean. */
  renderBlockHtml(index: number): string {
    const cached = this.#htmlCache[index];
    if (cached !== undefined) return cached;
    const block = this.blockAt(index);
    const html = block ? astToHtml([block], this.blocks, this.inlines) : '';
    this.#htmlCache[index] = html;
    return html;
  }

  /** One top-level block, materialized transiently. */
  blockAt(index: number): ASTBlockNode | null {
    const cd = this.#columnar;
    const row = cd.rowOfTopLevel(index);
    return row < cd.rows ? blockFromRow(cd, row) : null;
  }

  /** Number of top-level blocks. */
  blockCount(): number {
    return topLevelCount(this.#columnar);
  }

  readonly blocks = new Map<string, BaseBlockBehavior>();
  readonly inlines = new Map<string, BaseInlineBehavior>();

  #undoStack = signal<EditorTransaction[]>([]);
  #redoStack = signal<EditorTransaction[]>([]);

  readonly version = signal(0);

  readonly lastTransaction = signal<EditorTransaction | null>(null);

  readonly canUndo = computed(() => this.#undoStack().length > 0);
  readonly canRedo = computed(() => this.#redoStack().length > 0);

  readonly pendingMarks = signal<{
    /** Flat caret position the marks were staged at. */
    pos: number;
    marks: ASTMark[];
  } | null>(null);

  #pendingAt(pos: number): ASTMark[] | null {
    const pending = this.pendingMarks();
    return pending && pending.pos === pos ? pending.marks : null;
  }

  register(behavior: BaseBlockBehavior | BaseInlineBehavior) {
    if (behavior instanceof BaseBlockBehavior) this.blocks.set(behavior.type, behavior);
    else this.inlines.set(behavior.type, behavior);
  }

  /**
   * Apply a columnar mutation: the primitive has already advanced the
   * columnar document, so only the tree and the history need the op.
   */
  #apply(mutation: ColumnarMutation | null, selBefore: LogicalSelection) {
    if (!mutation) return;
    this.#noteOp(mutation.op);
    this.selection.live.set(mutation.selAfter);
    const tx: EditorTransaction = {
      baseVersion: this.version(),
      op: mutation.op,
      selBefore: { ...selBefore },
      selAfter: { ...mutation.selAfter },
    };
    this.#undoStack.update((s) => [...s, tx]);
    if (this.#redoStack().length) this.#redoStack.set([]);
    this.version.update((v) => v + 1);
    this.lastTransaction.set(tx);
  }

  handleEscapeHatch(): boolean {
    const sel = this.selection.active();
    if (!sel) return false;
    const result = escapeHatchOp(this.columnar, sel, this.blocks);
    if (!result) return false;
    if (result.op) this.#apply(result as ColumnarMutation, sel);
    else this.selection.live.set(result.selAfter);
    return true;
  }

  handleEnter() {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(enterOp(this.columnar, sel, this.blocks), sel);
  }

  handleBackspace() {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(backspaceOp(this.columnar, sel, this.blocks), sel);
  }

  insertText(text: string) {
    const sel = this.selection.active();
    if (!sel) return;
    const pending = sel.from === sel.to ? this.#pendingAt(sel.from) : null;
    this.pendingMarks.set(null);
    this.#apply(insertTextOp(this.columnar, sel, text, this.blocks, this.inlines, pending), sel);
  }

  deleteRange() {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(deleteRangeOp(this.columnar, sel, this.blocks), sel);
  }

  deleteForward() {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(deleteForwardOp(this.columnar, sel, this.blocks), sel);
  }

  readonly activeFormats = computed(() => {
    this.version();
    const sel = this.selection.active();
    if (!sel)
      return {
        blockType: null as string | null,
        blockAttrs: null as Record<string, any> | null,
        marks: [] as ASTMark[],
      };

    const cd = this.columnar;
    if (!cd.rows) return { blockType: null, blockAttrs: null, marks: [] as ASTMark[] };

    const isCollapsed = sel.from === sel.to;
    const a = pointAt(cd, sel.from);
    const root = rootRowOf(cd, a.row);
    const blockType = cd.typeOf(root);
    const blockAttrs = (cd.attrsOf(root) as Record<string, any> | undefined) ?? null;

    let marks: ASTMark[] = [];
    if (cd.kindOf(a.row) === RowKind.Text) {
      const b = isCollapsed ? a : pointAt(cd, sel.to);
      if (!isCollapsed && b.row === a.row && b.offset > a.offset) {
        marks = this.#marksCovering(cd, a.row, a.offset, b.offset);
      } else {
        marks = this.#marksAtCaret(cd, a.row, a.offset);
      }
    }

    if (isCollapsed) {
      const pending = this.#pendingAt(sel.from);
      if (pending) marks = structuredClone(pending);
    }

    return { blockType, blockAttrs, marks };
  });

  /** Marks the run before the caret carries — the boundary belongs to the earlier run. */
  #marksAtCaret(cd: ColumnarDocument, row: number, offset: number): ASTMark[] {
    if (cd.textOf(row).length === 0) return [];
    const seen = new Set<string>();
    const out: ASTMark[] = [];
    for (const mark of cd.marksAt(row, offset > 0 ? offset - 1 : 0)) {
      const key = JSON.stringify({ t: mark.type, a: mark.attrs ?? null });
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(structuredClone(mark));
    }
    return out;
  }

  /** Marks covering every character of `[from, to)` in a row. */
  #marksCovering(cd: ColumnarDocument, row: number, from: number, to: number): ASTMark[] {
    const [qFrom, qTo] = cd.runRangeOf(row);
    const quads = cd.markRuns;
    const out: ASTMark[] = [];
    const seen = new Set<string>();
    for (let q = qFrom; q < qTo; q++) {
      // Runs are normalized per mark, so full coverage of a contiguous range
      // means a single run spans it.
      if (quads[q * 4 + 1] <= from && quads[q * 4 + 2] >= to) {
        const mark = cd.markDefs[quads[q * 4 + 3]];
        const key = JSON.stringify({ t: mark.type, a: mark.attrs ?? null });
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(structuredClone(mark));
      }
    }
    return out;
  }

  isActive(action: string, attrs?: Record<string, any>): boolean {
    const state = this.activeFormats();

    if (this.blocks.has(action)) {
      if (state.blockType !== action) return false;
      if (attrs && Object.keys(attrs).length > 0) {
        return Object.entries(attrs).every(([k, v]) => state.blockAttrs?.[k] === v);
      }
      return true;
    }

    if (this.inlines.has(action)) {
      return state.marks.some((m) => m.type === action);
    }

    return false;
  }

  readonly uiRequest = signal<{ action: string; token: number } | null>(null);
  #uiToken = 0;

  dispatch(action: string, attrs?: Record<string, any>) {
    if (this.blocks.has(action)) {
      const behavior = this.blocks.get(action)!;
      if (behavior.requestsUi && (!attrs || Object.keys(attrs).length === 0)) {
        this.uiRequest.set({ action, token: ++this.#uiToken });
      } else {
        this.setBlockType(action, attrs);
      }
    } else if (this.inlines.has(action)) {
      const behavior = this.inlines.get(action)!;
      if (behavior.requestsUi && (!attrs || Object.keys(attrs).length === 0)) {
        this.uiRequest.set({ action, token: ++this.#uiToken });
      } else {
        this.toggleMark(action, attrs);
      }
    } else if (action === 'undo') this.undo();
    else if (action === 'redo') this.redo();
  }

  readonly slashState = computed<{ query: string; length: number } | null>(() => {
    const sel = this.selection.active();
    if (!sel || sel.from !== sel.to) return null;
    this.version();
    const cd = this.columnar;
    if (!cd.rows) return null;
    const p = pointAt(cd, sel.from);
    if (cd.kindOf(p.row) !== RowKind.Text) return null;
    const before = cd.textOf(p.row).slice(0, p.offset);
    const m = /(?:^|\s)\/(\S*)$/.exec(before);
    return m ? { query: m[1], length: m[1].length + 1 } : null;
  });

  slashCommands(): SlashCommand[] {
    const ctx = { engine: this };
    const out: SlashCommand[] = [];
    for (const behavior of this.blocks.values()) {
      if (behavior.slashCommands) out.push(...behavior.slashCommands(ctx));
    }
    return out;
  }

  applySlashCommand(cmd: SlashCommand) {
    const state = this.slashState();
    const sel = this.selection.active();
    if (state && sel && sel.from === sel.to) {
      // Flat positions inside one text holder are contiguous, so the query is
      // exactly the `length` positions before the caret.
      this.selection.live.set({ from: sel.from - state.length, to: sel.from });
      this.deleteRange();
    }
    cmd.run({ engine: this });
  }

  setMark(markType: string, attrs?: Record<string, any>): boolean {
    const sel = this.#markTargetSelection(markType);
    if (!sel) return false;
    this.pendingMarks.set(null);
    this.#apply(toggleMarkOp(this.columnar, sel, markType, attrs, this.blocks, 'add'), sel);
    return true;
  }

  removeMark(markType: string): boolean {
    const sel = this.#markTargetSelection(markType);
    if (!sel) return false;
    this.pendingMarks.set(null);
    this.#apply(toggleMarkOp(this.columnar, sel, markType, undefined, this.blocks, 'remove'), sel);
    return true;
  }

  insertTextWithMarks(text: string, marks: ASTMark[]) {
    const sel = this.selection.active();
    if (!sel || sel.from !== sel.to) return;
    this.pendingMarks.set({ pos: sel.from, marks: structuredClone(marks) });
    this.insertText(text);
  }

  readonly selectedBlock = signal<number | null>(null);

  readonly selectedBlockNode = computed(() => {
    const i = this.selectedBlock();
    if (i === null) return null;
    this.version();
    return this.blockAt(i);
  });

  selectBlock(index: number) {
    const cd = this.columnar;
    const row = cd.rowOfTopLevel(index);
    if (row >= cd.rows || this.blocks.get(cd.typeOf(row))?.category !== 'void') return;
    this.pendingMarks.set(null);
    const pos = cd.startOf(row);
    this.selection.live.set({ from: pos, to: pos });
    this.selectedBlock.set(index);
  }

  clearBlockSelection() {
    if (this.selectedBlock() !== null) this.selectedBlock.set(null);
  }


  insertImage(attrs: Record<string, unknown>) {
    const sel = this.selection.active();
    if (!sel) return;
    const mutation = insertImageOp(this.columnar, sel, this.blocks, attrs);
    if (!mutation) return;
    this.#apply(mutation, sel);
    this.selectBlock(mutation.blockIndex);
  }

  updateSelectedImage(attrs: Record<string, unknown>) {
    const idx = this.selectedBlock();
    if (idx === null) return;
    const cd = this.columnar;
    const row = cd.rowOfTopLevel(idx);
    if (row >= cd.rows || this.blocks.get(cd.typeOf(row))?.category !== 'void') return;
    const patched = blockFromRow(cd, row);
    patched.attrs = { ...(patched.attrs ?? {}), ...attrs };
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    this.#apply(replaceBlocksOp(cd, idx, 1, [patched], sel), sel);
  }

  moveBlock(from: number, to: number) {
    const cd = this.columnar;
    const count = this.blockCount();
    if (from < 0 || from >= count || to < 0 || to > count) return;
    if (to === from || to === from + 1) return;
    const insertAt = to > from ? to - 1 : to;
    const lo = Math.min(from, insertAt);
    const hi = Math.max(from, insertAt);
    const span: ASTBlockNode[] = [];
    for (let i = lo; i <= hi; i++) span.push(this.blockAt(i)!);
    const [moved] = span.splice(from - lo, 1);
    span.splice(insertAt - lo, 0, moved);
    const isVoid = this.blocks.get(cd.typeOf(cd.rowOfTopLevel(from)))?.category === 'void';
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    this.#apply(replaceBlocksOp(cd, lo, hi - lo + 1, span, sel), sel);
    if (this.selectedBlock() === from && isVoid) this.selectBlock(insertAt);
  }

  deleteSelectedBlock() {
    const idx = this.selectedBlock();
    if (idx === null) return;
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    const mutation = deleteBlockOp(this.columnar, idx);
    if (!mutation) return;
    this.clearBlockSelection();
    this.#apply(mutation, sel);
  }

  applyStyle(patch: Record<string, string | null | undefined>) {
    const merged: Record<string, string> = { ...(this.markAtSelection('style')?.attrs as Record<string, string> | undefined) };
    for (const [prop, value] of Object.entries(patch)) {
      if (value == null || value === '') delete merged[prop];
      else merged[prop] = value;
    }
    if (Object.keys(merged).length === 0) this.removeMark('style');
    else this.setMark('style', merged);
  }

  readonly currentStyle = computed<Record<string, string>>(() => {
    this.version();
    this.selection.active();
    return (this.markAtSelection('style')?.attrs as Record<string, string>) ?? {};
  });

  markAtSelection(markType: string): ASTMark | null {
    const sel = this.selection.active();
    if (!sel) return null;
    const direct = this.activeFormats().marks.find((m) => m.type === markType);
    if (direct) return structuredClone(direct);
    if (sel.from !== sel.to) return null;

    const run = this.#expandToMarkRun(sel.from, markType);
    if (!run) return null;
    const cd = this.columnar;
    const p = pointAt(cd, run.from);
    const startChar = p.offset;
    const endChar = pointAt(cd, run.to).offset;

    const [qFrom, qTo] = cd.runRangeOf(p.row);
    const quads = cd.markRuns;
    for (let q = qFrom; q < qTo; q++) {
      const mark = cd.markDefs[quads[q * 4 + 3]];
      if (mark.type !== markType) continue;
      if (quads[q * 4 + 1] < endChar && quads[q * 4 + 2] > startChar) return structuredClone(mark);
    }
    return null;
  }

  #markTargetSelection(markType: string): LogicalSelection | null {
    const sel = this.selection.active();
    if (!sel) return null;
    if (sel.from !== sel.to) return sel;
    const run = this.#expandToMarkRun(sel.from, markType);
    if (!run) return null;
    this.selection.live.set(run);
    return run;
  }

  /**
   * The contiguous span of `markType` coverage around a caret, in flat
   * positions. Runs of the same type merge across differing attrs — a caret
   * inside one link expands over an adjacent link too, matching how the marks
   * behave as one visual run.
   */
  #expandToMarkRun(pos: number, markType: string): LogicalSelection | null {
    const cd = this.columnar;
    if (!cd.rows) return null;
    const p = pointAt(cd, pos);
    if (cd.kindOf(p.row) !== RowKind.Text) return null;

    const [qFrom, qTo] = cd.runRangeOf(p.row);
    const quads = cd.markRuns;
    const intervals: [number, number][] = [];
    for (let q = qFrom; q < qTo; q++) {
      if (cd.markDefs[quads[q * 4 + 3]].type !== markType) continue;
      const start = quads[q * 4 + 1];
      const end = quads[q * 4 + 2];
      const last = intervals[intervals.length - 1];
      if (last && start <= last[1]) last[1] = Math.max(last[1], end);
      else intervals.push([start, end]);
    }
    const run = intervals.find(([s, e]) => p.offset >= s && p.offset <= e);
    if (!run) return null;
    return { from: flatPosAt(cd, p.row, run[0]), to: flatPosAt(cd, p.row, run[1]) };
  }

  toggleMark(markType: string, attrs?: Record<string, any>) {
    const currentSel = this.selection.active();
    if (!currentSel) return;

    if (currentSel.from === currentSel.to) {

      const base = this.#pendingAt(currentSel.from) ?? this.activeFormats().marks;
      const has = base.some((m) => m.type === markType);
      const marks = has
        ? base.filter((m) => m.type !== markType)
        : [...base, { type: markType, ...(attrs ? { attrs } : {}) } as ASTMark];
      this.pendingMarks.set({ pos: currentSel.from, marks: structuredClone(marks) });
      return;
    }

    this.pendingMarks.set(null);
    this.#apply(toggleMarkOp(this.columnar, currentSel, markType, attrs, this.blocks), currentSel);
  }

  insertFragment(fragment: ASTDocument) {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(insertFragmentOp(this.columnar, sel, fragment, this.blocks), sel);
  }

  setBlockType(type: string, attrs?: any) {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(setBlockTypeOp(this.columnar, sel, type, this.blocks, attrs), sel);
  }

  serialize(format: 'html' | 'json' | 'markdown'): any {
    if (format === 'json') return fromColumnar(this.#columnar);
    if (format === 'markdown') return astToMarkdown(this.document(), this.blocks, this.inlines);
    // HTML assembles from the per-block cache, so a keystroke re-serializes
    // one block, not the document.
    const count = this.blockCount();
    let out = '';
    for (let i = 0; i < count; i++) out += this.renderBlockHtml(i);
    return out;
  }

  reset(doc: ASTDocument) {
    const oldDoc = this.document();
    this.#columnar = toColumnar(doc);
    this.#markAllDirty();
    const op = diffDocuments(oldDoc, doc);
    if (op) {
      const selAfter = this.selection.active();
      const tx: EditorTransaction = {
        baseVersion: this.version(),
        op,
        selBefore: null,
        selAfter: selAfter ? { ...selAfter } : null,
      };
      this.#undoStack.update((s) => [...s, tx]);
      if (this.#redoStack().length) this.#redoStack.set([]);
      this.lastTransaction.set(tx);
    }
    this.version.update((v) => v + 1);
  }

  /** Replace one top-level block in place (DOM reconciliation after IME). */
  replaceBlock(index: number, block: ASTBlockNode) {
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    this.#apply(replaceBlocksOp(this.columnar, index, 1, [block], sel), sel);
  }

  undo() {
    const stack = this.#undoStack();
    const tx = stack[stack.length - 1];
    if (!tx) return;
    this.#undoStack.set(stack.slice(0, -1));
    const undoOp = invertOp(tx.op);
    applyOpToColumnar(this.#columnar, undoOp);
    this.#noteOp(undoOp);
    if (tx.selBefore) this.selection.live.set({ ...tx.selBefore });
    this.#redoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  redo() {
    const stack = this.#redoStack();
    const tx = stack[stack.length - 1];
    if (!tx) return;
    this.#redoStack.set(stack.slice(0, -1));
    applyOpToColumnar(this.#columnar, tx.op);
    this.#noteOp(tx.op);
    if (tx.selAfter) this.selection.live.set({ ...tx.selAfter });
    this.#undoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  applyRemoteOperation(op: EditorOp) {
    // The StepMap keeps diffFlat's association semantics exactly (it disagrees
    // with stepMapFromOp on 7.5% of positions), which needs the old and new
    // trees — materialized here; remote ops are the one path that still pays
    // for a tree. A span-scoped equivalent is the follow-up optimization.
    const oldDoc = this.document();
    const newDoc = applyOp(oldDoc, op);
    const map = diffFlat(oldDoc, newDoc);
    if (!map) return;
    applyOpToColumnar(this.#columnar, op);
    this.#noteOp(op);

    // Selections are flat positions, so mapping them through a remote op is a
    // direct StepMap lookup — no tree round-trip.
    const mapSel = (sel: LogicalSelection | null): LogicalSelection | null => {
      if (!sel) return null;
      const from = map.map(sel.from, -1);
      return { from, to: sel.from === sel.to ? from : map.map(sel.to, -1) };
    };

    const live = mapSel(this.selection.active());
    if (live) this.selection.live.set(live);

    const selBlock = this.selectedBlock();
    if (selBlock !== null) {
      const lp = posToLogical(newDoc, map.map(logicalToPos(oldDoc, { blockIndex: selBlock, inlineIndex: 0, offset: 0 }), 1));
      const stillVoid = lp != null && this.blocks.get(newDoc[lp.blockIndex]?.type)?.category === 'void';
      this.selectedBlock.set(stillVoid ? lp!.blockIndex : null);
    }

    this.#undoStack.update((stack) => {
      const out: EditorTransaction[] = [];
      let remote: EditorOp = op;
      for (let k = stack.length - 1; k >= 0; k--) {
        const tx = stack[k];
        const inverse = invertOp(tx.op);
        const rebasedInverse = transformOp(inverse, remote, 'right');
        const remoteNext = rebasedInverse ? transformOp(remote, inverse, 'left') : null;
        if (!rebasedInverse || !remoteNext) return out.reverse();
        out.push({ ...tx, op: invertOp(rebasedInverse), selBefore: mapSel(tx.selBefore), selAfter: mapSel(tx.selAfter) });
        remote = remoteNext;
      }
      return out.reverse();
    });

    this.#redoStack.update((stack) => {
      const out: EditorTransaction[] = [];
      let remote: EditorOp = op;
      for (let k = stack.length - 1; k >= 0; k--) {
        const tx = stack[k];
        const rebased = transformOp(tx.op, remote, 'right');
        const remoteAbove = rebased ? transformOp(remote, tx.op, 'left') : null;
        if (!rebased || !remoteAbove) return out.reverse();
        out.push({ ...tx, op: rebased, selBefore: mapSel(tx.selBefore), selAfter: mapSel(tx.selAfter) });
        remote = remoteAbove;
      }
      return out.reverse();
    });
    this.version.update((v) => v + 1);
  }

}
