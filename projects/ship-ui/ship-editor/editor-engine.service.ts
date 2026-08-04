import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { BaseBlockBehavior, BaseInlineBehavior, SlashCommand } from './editor-behaviors';
import { astToHtml, blockToMarkdown } from './editor-serializers';
import { ColumnarDocument, RowKind, fromColumnar, toColumnar } from './editor-columnar';
import {
  ColumnarMutation,
  backspaceOp,
  blockFromRow,
  blockPointAt,
  deleteBlockOp,
  deleteForwardOp,
  deleteRangeOp,
  enterOp,
  escapeHatchOp,
  flatPosAt,
  flatPosOfBlockChar,
  insertVoidBlockOp,
  moveBlockSpanOp,
  insertFragmentOp,
  replaceBlockWithFragmentOp,
  insertTextOp,
  pointAt,
  remoteStepMap,
  replaceBlocksOp,
  rootRowOf,
  setBlockTypeOp,
  toggleMarkOp,
  topLevelCount,
} from './editor-columnar-mutations';
import { applyOpToColumnar } from './editor-columnar-ops';
import { EditorOp, EditorTransaction, diffDocuments, invertOp, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTMark, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { shiftRange } from './editor-multi-selection';

/** What the DOM must do to catch up with one op. */
export type RenderHint =
  | { kind: 'all' }
  | { kind: 'block'; index: number }
  | { kind: 'splice'; at: number; remove: number; insert: number };

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
  // Render bookkeeping: the ops since the DOM last looked, expressed as
  // render hints, plus a per-block HTML cache shared by patchDOM and
  // serialize. A structural op is a DOM *splice* — the suffix shifts without
  // being touched — which is what keeps Enter O(1) instead of re-rendering
  // every block after the caret.
  // -------------------------------------------------------------------------

  #htmlCache: (string | undefined)[] = [];
  #mdCache: (string | undefined)[] = [];
  #renderHints: RenderHint[] = [{ kind: 'all' }];

  #noteOp(op: EditorOp) {
    if (op.kind === 'inline') {
      this.#renderHints.push({ kind: 'block', index: op.blockIndex });
      this.#htmlCache[op.blockIndex] = undefined;
      this.#mdCache[op.blockIndex] = undefined;
    } else {
      // A `block` hint names its block by index, and that index is resolved
      // against the AST when the DOM is painted rather than when the hint was
      // recorded. A structural op renumbers everything after it, which leaves
      // an already-queued hint unreplayable: hints are applied in order, so
      // before the splice its index still addresses the old DOM but renders
      // the new AST, and re-indexing it for the new AST would then address an
      // element the splice has not created yet. Either way it repaints the
      // wrong block and the splice inserts on top of the mess.
      //
      // Repaint everything instead. This only comes up for composite edits —
      // a slash command deletes its query and then inserts a block — never
      // for typing, which queues nothing but `block` hints.
      const { at } = op;
      const remove = op.removed.length;
      const insert = op.inserted.length;
      if (this.#renderHints.some((hint) => hint.kind === 'block' && hint.index >= at)) {
        this.#renderHints = [{ kind: 'all' }];
      } else {
        this.#renderHints.push({ kind: 'splice', at, remove, insert });
      }
      // The suffix shifts but its content is unchanged; splicing keeps those
      // blocks' rendered output reusable at their new indices.
      const blanks = () => new Array<string | undefined>(op.inserted.length).fill(undefined);
      this.#htmlCache.splice(op.at, op.removed.length, ...blanks());
      this.#mdCache.splice(op.at, op.removed.length, ...blanks());
    }
  }

  #markAllDirty() {
    this.#renderHints = [{ kind: 'all' }];
    this.#htmlCache = [];
    this.#mdCache = [];
  }

  /** The ops since the last render, as hints; consumed by the render pass. */
  consumeRenderHints(): RenderHint[] {
    const out = this.#renderHints;
    this.#renderHints = [];
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
  /** Set while a multi-cursor edit is fanning out, so its transactions group. */
  #group: number | null = null;
  #groupSeq = 0;

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

  unregister(behavior: BaseBlockBehavior | BaseInlineBehavior) {
    // Identity-checked: swapping in a replacement of the same type must not
    // have its registration deleted by the removal of the one it replaced.
    if (behavior instanceof BaseBlockBehavior) {
      if (this.blocks.get(behavior.type) === behavior) this.blocks.delete(behavior.type);
    } else if (this.inlines.get(behavior.type) === behavior) {
      this.inlines.delete(behavior.type);
    }
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
      ...(this.#group === null ? {} : { groupId: this.#group }),
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
    const result = insertTextOp(this.columnar, sel, text, this.blocks, this.inlines, pending);
    if (!result) return;
    if (result.op) this.#apply(result as ColumnarMutation, sel);
    else this.selection.live.set(result.selAfter);
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
      } else if (!isCollapsed && b.row > a.row) {
        // A range spanning rows reports the marks covering ALL of it — the
        // caret fallback would read the character before the selection and
        // invert what the toolbar toggle then does.
        marks = this.#marksCoveringRows(cd, a, b);
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

  /** Marks covering every non-empty text segment of a multi-row range. */
  #marksCoveringRows(cd: ColumnarDocument, a: { row: number; offset: number }, b: { row: number; offset: number }): ASTMark[] {
    let acc: ASTMark[] | null = null;
    for (let row = a.row; row <= b.row; row++) {
      if (cd.kindOf(row) !== RowKind.Text) continue;
      const from = row === a.row ? a.offset : 0;
      const to = row === b.row ? b.offset : cd.textOf(row).length;
      // Empty segments (an empty line, a range ending at offset 0) carry no
      // marks and must not veto the intersection.
      if (to <= from) continue;
      const rowMarks = this.#marksCovering(cd, row, from, to);
      acc = acc === null ? rowMarks : acc.filter((m) => rowMarks.some((r) => r.type === m.type));
      if (acc.length === 0) return [];
    }
    return acc ?? [];
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
    this.insertVoidBlock('image', attrs);
  }

  /** Insert a void block of `type` at the selection and select it. */
  insertVoidBlock(type: string, attrs: Record<string, unknown> = {}) {
    if (this.blocks.get(type)?.category !== 'void') return;
    const sel = this.selection.active();
    if (!sel) return;
    const mutation = insertVoidBlockOp(this.columnar, sel, this.blocks, type, attrs);
    if (!mutation) return;
    this.#apply(mutation, sel);
    this.selectBlock(mutation.blockIndex);
  }

  updateSelectedImage(attrs: Record<string, unknown>) {
    const idx = this.selectedBlock();
    if (idx !== null) this.updateBlockAttrs(idx, attrs);
  }

  /** Merge `attrs` into a void block's attrs as one undoable transaction. */
  updateBlockAttrs(index: number, attrs: Record<string, unknown>) {
    const cd = this.columnar;
    const row = cd.rowOfTopLevel(index);
    if (row >= cd.rows || this.blocks.get(cd.typeOf(row))?.category !== 'void') return;
    const patched = blockFromRow(cd, row);
    patched.attrs = { ...(patched.attrs ?? {}), ...attrs };
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    this.#apply(replaceBlocksOp(cd, index, 1, [patched], sel), sel);
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

  /**
   * The top-level block span the current selection touches — the selected
   * void block when there is one, otherwise every block the text selection
   * reaches. A selection ending exactly at a block's start hasn't entered
   * that block, mirroring `sh-code`'s line-span rule.
   */
  selectedBlockSpan(): { first: number; count: number } | null {
    const selected = this.selectedBlock();
    if (selected !== null) return { first: selected, count: 1 };
    const sel = this.selection.active();
    if (!sel) return null;
    const cd = this.columnar;
    const lo = Math.min(sel.from, sel.to);
    const hi = Math.max(sel.from, sel.to);
    const first = blockPointAt(cd, lo).blockIndex;
    const rawLast = blockPointAt(cd, hi).blockIndex;
    const startOfLast = flatPosOfBlockChar(cd, { blockIndex: rawLast, itemIndex: 0, charOffset: 0 });
    const last = rawLast > first && hi === startOfLast ? rawLast - 1 : rawLast;
    return { first, count: last - first + 1 };
  }

  /**
   * Move the blocks the selection touches one slot up or down — the
   * code-editor gesture over blocks. Reports whether anything moved so the
   * caller can skip its re-render at the document's edges.
   */
  moveSelectedBlocks(direction: -1 | 1): boolean {
    const span = this.selectedBlockSpan();
    if (!span) return false;
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    const mutation = moveBlockSpanOp(this.columnar, span.first, span.count, direction, sel);
    if (!mutation) return false;
    const selectedBefore = this.selectedBlock();
    this.#apply(mutation, sel);
    // A selected void block keeps its selection border on its new index.
    if (selectedBefore !== null) this.selectBlock(selectedBefore + direction);
    return true;
  }

  /** Paste over a selected void block: the fragment replaces it. */
  replaceSelectedBlock(fragment: ASTDocument) {
    const idx = this.selectedBlock();
    if (idx === null) return;
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    const result = replaceBlockWithFragmentOp(this.columnar, idx, fragment);
    if (!result) return;
    this.clearBlockSelection();
    if (result.op) this.#apply(result as ColumnarMutation, sel);
    else this.selection.live.set(result.selAfter);
  }

  deleteSelectedBlock() {
    const idx = this.selectedBlock();
    if (idx !== null) this.deleteBlock(idx);
  }

  /** Delete one top-level block by index. */
  deleteBlock(index: number) {
    const sel = this.selection.active() ?? { from: 0, to: 0 };
    const mutation = deleteBlockOp(this.columnar, index);
    if (!mutation) return;
    if (this.selectedBlock() === index) this.clearBlockSelection();
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
    const result = insertFragmentOp(this.columnar, sel, fragment, this.blocks);
    if (!result) return;
    if (result.op) this.#apply(result as ColumnarMutation, sel);
    // Replacing a selection with identical content is a no-op for the
    // document, but the selection still collapses after the pasted content.
    else this.selection.live.set(result.selAfter);
  }

  setBlockType(type: string, attrs?: any) {
    const sel = this.selection.active();
    if (!sel) return;
    this.#apply(setBlockTypeOp(this.columnar, sel, type, this.blocks, attrs), sel);
  }

  serialize(format: 'html' | 'json' | 'markdown'): any {
    if (format === 'json') return fromColumnar(this.#columnar);
    // HTML and markdown assemble from per-block caches, so a keystroke
    // re-serializes one block, not the document.
    const count = this.blockCount();
    let out = '';
    if (format === 'markdown') {
      for (let i = 0; i < count; i++) out += this.#blockMarkdown(i);
      return out.trim();
    }
    for (let i = 0; i < count; i++) out += this.renderBlockHtml(i);
    return out;
  }

  #blockMarkdown(index: number): string {
    const cached = this.#mdCache[index];
    if (cached !== undefined) return cached;
    const block = this.blockAt(index);
    const md = block ? blockToMarkdown(block, this.blocks, this.inlines) : '';
    this.#mdCache[index] = md;
    return md;
  }

  reset(doc: ASTDocument) {
    // Trim the equal prefix and suffix block-by-block against the columnar
    // content (each old block materialized transiently), then let
    // diffDocuments shape the op for just the span that differs — including
    // its single-text-block inline downgrade.
    const oldCount = this.blockCount();
    const key = (block: ASTBlockNode | null) => JSON.stringify(block);
    let startTrim = 0;
    const minLen = Math.min(oldCount, doc.length);
    while (startTrim < minLen && key(this.blockAt(startTrim)) === key(doc[startTrim])) startTrim++;
    let endOld = oldCount;
    let endNew = doc.length;
    while (endOld > startTrim && endNew > startTrim && key(this.blockAt(endOld - 1)) === key(doc[endNew - 1])) {
      endOld--;
      endNew--;
    }

    let op: EditorOp | null = null;
    if (!(startTrim === endOld && startTrim === endNew)) {
      const oldMid: ASTBlockNode[] = [];
      for (let i = startTrim; i < endOld; i++) oldMid.push(this.blockAt(i)!);
      const mid = diffDocuments(oldMid, doc.slice(startTrim, endNew));
      if (mid) op = mid.kind === 'block' ? { ...mid, at: mid.at + startTrim } : { ...mid, blockIndex: mid.blockIndex + startTrim };
    }

    this.#columnar = toColumnar(doc);
    this.#markAllDirty();
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
    // A multi-cursor edit left one transaction per cursor; they come back as
    // one step, newest first so each op inverts against the document it saw.
    const count = tx.groupId === undefined ? 1 : runLength(stack, tx.groupId);
    const undone = stack.slice(stack.length - count);
    this.#undoStack.set(stack.slice(0, stack.length - count));
    for (let i = undone.length - 1; i >= 0; i--) {
      const undoOp = invertOp(undone[i].op);
      applyOpToColumnar(this.#columnar, undoOp);
      this.#noteOp(undoOp);
    }
    const first = undone[0];
    if (first.selBefore) this.selection.live.set({ ...first.selBefore });
    if (count > 1) this.selection.secondary.set(secondaryOf(undone, 'selBefore', first.selBefore));
    else this.selection.clearSecondary();
    this.#redoStack.update((s) => [...s, ...undone]);
    this.version.update((v) => v + 1);
  }

  redo() {
    const stack = this.#redoStack();
    const tx = stack[stack.length - 1];
    if (!tx) return;
    const count = tx.groupId === undefined ? 1 : runLength(stack, tx.groupId);
    // The redo stack holds the group in reverse; replay it in original order.
    const group = stack.slice(stack.length - count);
    this.#redoStack.set(stack.slice(0, stack.length - count));
    for (const entry of group) {
      applyOpToColumnar(this.#columnar, entry.op);
      this.#noteOp(entry.op);
    }
    const last = group[group.length - 1];
    if (last.selAfter) this.selection.live.set({ ...last.selAfter });
    if (count > 1) this.selection.secondary.set(secondaryOf(group, 'selAfter', last.selAfter));
    else this.selection.clearSecondary();
    this.#undoStack.update((s) => [...s, ...group]);
    this.version.update((v) => v + 1);
  }

  /**
   * Run `edit` once per cursor as a single undo step.
   *
   * Cursors are visited low to high and each one's range is shifted by the
   * net size change the edits below it produced — so the edit always lands
   * where the user's cursor actually is, and the post-images recorded on the
   * way up stay valid because every later edit is above them.
   */
  runAtEveryCursor(edit: () => void) {
    const ranges = this.selection.ranges();
    if (ranges.length <= 1) return edit();

    const group = ++this.#groupSeq;
    const primary = this.selection.active();
    const primaryAt = primary ? ranges.findIndex((r) => r.from <= primary.from && r.to >= primary.to) : 0;
    this.#group = group;
    try {
      const after: LogicalSelection[] = [];
      let delta = 0;
      for (const range of ranges) {
        const before = this.columnar.size;
        this.selection.live.set(shiftRange(range, delta));
        edit();
        delta += this.columnar.size - before;
        const now = this.selection.active();
        if (now) after.push({ ...now });
      }
      if (!after.length) return;
      const at = Math.min(Math.max(primaryAt, 0), after.length - 1);
      this.selection.live.set({ ...after[at] });
      this.selection.secondary.set(after.filter((_, i) => i !== at));
    } finally {
      this.#group = null;
    }
  }

  applyRemoteOperation(op: EditorOp) {
    // remoteStepMap reproduces diffFlat's association semantics exactly
    // (deliberately not stepMapFromOp's — they disagree on 7.5% of mapped
    // positions) while materializing only the blocks the op touches; the
    // fuzz spec holds it to the materialize-and-diff oracle.
    const cd = this.#columnar;
    const map = remoteStepMap(cd, op);
    if (!map) return;
    const selBlock = this.selectedBlock();
    const selBlockStart = selBlock !== null ? cd.startOf(cd.rowOfTopLevel(selBlock)) : null;
    applyOpToColumnar(cd, op);
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

    if (selBlockStart !== null) {
      const blockIndex = blockPointAt(cd, map.map(selBlockStart, 1)).blockIndex;
      const row = cd.rowOfTopLevel(blockIndex);
      const stillVoid = row < cd.rows && this.blocks.get(cd.typeOf(row))?.category === 'void';
      this.selectedBlock.set(stillVoid ? blockIndex : null);
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

/** How many transactions at the top of `stack` share `groupId`. */
function runLength(stack: readonly EditorTransaction[], groupId: number): number {
  let count = 0;
  for (let i = stack.length - 1; i >= 0 && stack[i].groupId === groupId; i--) count++;
  return count;
}

/** Every cursor position in a group except the one that becomes primary. */
function secondaryOf(
  group: readonly EditorTransaction[],
  key: 'selBefore' | 'selAfter',
  primary: LogicalSelection | null
): LogicalSelection[] {
  const out: LogicalSelection[] = [];
  for (const tx of group) {
    const sel = tx[key];
    if (!sel || (primary && sel.from === primary.from && sel.to === primary.to)) continue;
    out.push({ ...sel });
  }
  return out;
}
