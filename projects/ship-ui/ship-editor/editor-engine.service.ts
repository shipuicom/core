import { Injectable, computed, inject, signal } from '@angular/core';
import { deleteRange, resolveInlinePosition } from './editor-ast.utils';
import { BaseBlockBehavior, BaseInlineBehavior, SlashCommand } from './editor-behaviors';
import { astToHtml, astToMarkdown } from './editor-serializers';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { ColumnarDocument, RowKind, toColumnar } from './editor-columnar';
import {
  ColumnarMutation,
  backspaceOp,
  deleteForwardOp,
  deleteRangeOp,
  enterOp,
  escapeHatchOp,
  flatPosAt,
  insertFragmentOp,
  insertTextOp,
  pointAt,
  rootRowOf,
  setBlockTypeOp,
  toggleMarkOp,
} from './editor-columnar-mutations';
import { applyOpToColumnar } from './editor-columnar-ops';
import { EditorOp, EditorTransaction, applyOp, diffDocuments, invertOp, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalPosition, LogicalSelection, TreeSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';

@Injectable()
export class EditorEngineService {
  readonly selection = inject(EditorSelectionService);

  readonly document = signal<ASTDocument>([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);

  /**
   * Columnar form of the document — what the mutation primitives operate on.
   *
   * The nested tree in `document()` is *derived* from it: each primitive
   * mutates the columnar document and returns an `EditorOp`, which advances
   * the tree (still needed for rendering and serialization). Rebuilding the
   * columnar form per edit would cost O(document), so it is only rebuilt when
   * someone replaces `document()` wholesale behind the engine's back —
   * detected by remembering which tree the mirror was built from.
   */
  #columnar: ColumnarDocument = toColumnar(this.document());
  /** The tree document `#columnar` currently corresponds to. */
  #columnarFor: ASTDocument = this.document();

  /** The columnar document, resynced if `document()` was set externally. */
  get columnar(): ColumnarDocument {
    this.#syncColumnar();
    return this.#columnar;
  }

  #syncColumnar() {
    const doc = this.document();
    if (this.#columnarFor === doc) return;
    this.#columnar = toColumnar(doc);
    this.#columnarFor = doc;
  }

  /** Advance columnar by an op, or rebuild when a document arrives wholesale. */
  #advanceColumnar(op: EditorOp | null) {
    if (op) applyOpToColumnar(this.#columnar, op);
    else this.#columnar = toColumnar(this.document());
    this.#columnarFor = this.document();
  }

  // -------------------------------------------------------------------------
  // Selection is flat {from, to}. The mutation primitives still navigate the
  // nested AST, so flat positions are translated to tree shape at their
  // boundary and back. These conversions disappear as the primitives move
  // onto the columnar document.
  // -------------------------------------------------------------------------

  #lpOf(doc: ASTDocument, pos: number): LogicalPosition {
    return posToLogical(doc, pos) ?? { blockIndex: 0, inlineIndex: 0, offset: 0 };
  }

  #toTreeSel(doc: ASTDocument, sel: LogicalSelection): TreeSelection {
    const start = this.#lpOf(doc, sel.from);
    const isCollapsed = sel.from === sel.to;
    return { start, end: isCollapsed ? start : this.#lpOf(doc, sel.to), isCollapsed };
  }

  #toFlatSel(doc: ASTDocument, sel: TreeSelection): LogicalSelection {
    const from = logicalToPos(doc, sel.start);
    return { from, to: sel.isCollapsed ? from : logicalToPos(doc, sel.end) };
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
    this.document.set(applyOp(this.document(), mutation.op));
    this.#columnarFor = this.document();
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
    this.document();
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
    this.document();
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
    return i !== null ? (this.document()[i] ?? null) : null;
  });

  selectBlock(index: number) {
    const block = this.document()[index];
    if (!block || this.blocks.get(block.type)?.category !== 'void') return;
    this.pendingMarks.set(null);
    const cd = this.columnar;
    const pos = cd.startOf(cd.rowOfTopLevel(index));
    this.selection.live.set({ from: pos, to: pos });
    this.selectedBlock.set(index);
  }

  clearBlockSelection() {
    if (this.selectedBlock() !== null) this.selectedBlock.set(null);
  }

  #isTextBlockEmpty(block: ASTBlockNode): boolean {
    const c = block.content as ASTInlineNode[];
    return c.length === 0 || (c.length === 1 && c[0].text === '');
  }

  insertImage(attrs: Record<string, unknown>) {
    const sel = this.selection.active();
    if (!sel) return;
    const oldDoc = this.document();
    const treeSel = this.#toTreeSel(oldDoc, sel);
    let doc = oldDoc;
    let base = treeSel;
    if (!treeSel.isCollapsed) {
      const t = deleteRange(oldDoc, treeSel, this.blocks);
      doc = t.doc;
      base = t.selectionShift ?? treeSel;
    }
    const idx = base.start.blockIndex;
    const block = doc[idx];
    const image: ASTBlockNode = { type: 'image', attrs: { ...attrs }, content: [] };
    const trailing: ASTBlockNode = { type: 'paragraph', content: [{ type: 'text', text: '' }] };
    const newDoc = [...doc];
    let imageIdx: number;
    if (block && block.type === 'paragraph' && this.#isTextBlockEmpty(block)) {
      newDoc.splice(idx, 1, image, trailing);
      imageIdx = idx;
    } else {
      newDoc.splice(idx + 1, 0, image, trailing);
      imageIdx = idx + 1;
    }
    this.document.set(newDoc);
    this.selectBlock(imageIdx);
    this.#commit(oldDoc, newDoc, sel);
  }

  updateSelectedImage(attrs: Record<string, unknown>) {
    const idx = this.selectedBlock();
    if (idx === null) return;
    const oldDoc = this.document();
    const block = oldDoc[idx];
    if (!block || this.blocks.get(block.type)?.category !== 'void') return;
    const newDoc = [...oldDoc];
    newDoc[idx] = { ...block, attrs: { ...(block.attrs ?? {}), ...attrs } };
    this.document.set(newDoc);
    this.#commit(oldDoc, newDoc, this.selection.active());
  }

  moveBlock(from: number, to: number) {
    const oldDoc = this.document();
    if (from < 0 || from >= oldDoc.length || to < 0 || to > oldDoc.length) return;
    if (to === from || to === from + 1) return;
    const block = oldDoc[from];
    const newDoc = [...oldDoc];
    newDoc.splice(from, 1);
    const insertAt = to > from ? to - 1 : to;
    newDoc.splice(insertAt, 0, block);
    this.document.set(newDoc);
    if (this.selectedBlock() === from && this.blocks.get(block.type)?.category === 'void') {
      this.selectBlock(insertAt);
    }
    this.#commit(oldDoc, newDoc, this.selection.active());
  }

  deleteSelectedBlock() {
    const idx = this.selectedBlock();
    if (idx === null) return;
    const oldDoc = this.document();
    if (!oldDoc[idx]) return;
    let newDoc = oldDoc.filter((_, i) => i !== idx);
    if (newDoc.length === 0) newDoc = [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }];
    this.document.set(newDoc);
    this.clearBlockSelection();
    const caretIdx = Math.min(idx, newDoc.length - 1);
    const cd = this.columnar;
    const start = cd.startOf(cd.rowOfTopLevel(caretIdx));
    const p = pointAt(cd, start);
    const pos = cd.kindOf(p.row) === RowKind.Void ? cd.startOf(p.row) : flatPosAt(cd, p.row, 0);
    this.selection.live.set({ from: pos, to: pos });
    this.#commit(oldDoc, newDoc, this.selection.active());
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
    this.document();
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
    if (format === 'json') return structuredClone(this.document());
    if (format === 'markdown') return astToMarkdown(this.document(), this.blocks, this.inlines);
    return astToHtml(this.document(), this.blocks, this.inlines);
  }

  reset(doc: ASTDocument) {

    const oldDoc = this.document();
    this.document.set(doc);
    this.#commit(oldDoc, doc, null);
  }

  commitDocument(newDoc: ASTDocument) {
    const oldDoc = this.document();
    const selBefore = this.selection.active();
    this.document.set(newDoc);
    this.#commit(oldDoc, newDoc, selBefore);
  }

  undo() {
    const stack = this.#undoStack();
    const tx = stack[stack.length - 1];
    if (!tx) return;
    this.#undoStack.set(stack.slice(0, -1));
    const undoOp = invertOp(tx.op);
    this.#syncColumnar();
    this.document.set(applyOp(this.document(), undoOp));
    this.#advanceColumnar(undoOp);
    if (tx.selBefore) this.selection.live.set({ ...tx.selBefore });
    this.#redoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  redo() {
    const stack = this.#redoStack();
    const tx = stack[stack.length - 1];
    if (!tx) return;
    this.#redoStack.set(stack.slice(0, -1));
    this.#syncColumnar();
    this.document.set(applyOp(this.document(), tx.op));
    this.#advanceColumnar(tx.op);
    if (tx.selAfter) this.selection.live.set({ ...tx.selAfter });
    this.#undoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  applyRemoteOperation(op: EditorOp) {
    const oldDoc = this.document();
    this.#syncColumnar();
    const newDoc = applyOp(oldDoc, op);
    const map = diffFlat(oldDoc, newDoc);
    if (!map) return;
    this.document.set(newDoc);
    this.#advanceColumnar(op);

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

  #commit(oldDoc: ASTDocument, newDoc: ASTDocument, selBefore: LogicalSelection | null) {
    const op = diffDocuments(oldDoc, newDoc);
    if (!op) return;
    // These paths (reset, DOM reconciliation, block-level UI ops) replace the
    // tree wholesale, so the columnar mirror is rebuilt rather than advanced —
    // it may not have been in step with `oldDoc` if the document signal was
    // set directly.
    this.#advanceColumnar(null);
    const selAfter = this.selection.active();
    const tx: EditorTransaction = {
      baseVersion: this.version(),
      op,
      selBefore: selBefore ? { ...selBefore } : null,
      selAfter: selAfter ? { ...selAfter } : null,
    };
    this.#undoStack.update((s) => [...s, tx]);
    if (this.#redoStack().length) this.#redoStack.set([]);
    this.version.update((v) => v + 1);
    this.lastTransaction.set(tx);
  }
}
