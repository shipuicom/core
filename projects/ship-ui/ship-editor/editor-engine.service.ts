import { Injectable, computed, inject, signal } from '@angular/core';
import {
  deleteForward,
  deleteRange,
  executeInsertText,
  handleBackspace,
  handleEnter,
  handleEscapeHatch,
  insertFragment,
  resolveInlinePosition,
  setBlockType,
  toggleMark,
} from './editor-ast.utils';
import { BaseBlockBehavior, BaseInlineBehavior, SlashCommand } from './editor-behaviors';
import { astToHtml, astToMarkdown } from './editor-serializers';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { ColumnarDocument, toColumnar } from './editor-columnar';
import { applyOpToColumnar } from './editor-columnar-ops';
import { EditorOp, EditorTransaction, applyOp, diffDocuments, invertOp, spliceInlineContent, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalPosition, LogicalSelection, TransactionResult, TreeSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';

@Injectable()
export class EditorEngineService {
  readonly selection = inject(EditorSelectionService);

  readonly document = signal<ASTDocument>([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);

  /**
   * Columnar view of the same document, advanced by the op behind every change.
   *
   * Rebuilding it per edit would cost O(document); every mutation here already
   * produces an `EditorOp`, so it is stepped forward instead. Nothing reads from
   * it yet - it is maintained first so the invariant can be trusted before
   * anything depends on it.
   */
  #columnar: ColumnarDocument = toColumnar(this.document());

  /** The columnar document. Kept in step with `document()`. */
  get columnar(): ColumnarDocument {
    return this.#columnar;
  }

  /** Advance columnar by an op, or rebuild when a document arrives wholesale. */
  #advanceColumnar(op: EditorOp | null) {
    if (op) applyOpToColumnar(this.#columnar, op);
    else this.#columnar = toColumnar(this.document());
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

  #charOffsetOf(pos: LogicalPosition): number {
    const block = this.document()[pos.blockIndex];
    if (!block) return pos.offset;
    const content = (
      pos.itemIndex !== undefined && this.blocks.get(block.type)?.category === 'container'
        ? ((block.content as ASTBlockNode[])[pos.itemIndex]?.content ?? [])
        : block.content
    ) as ASTInlineNode[];
    let chars = 0;
    for (let i = 0; i < pos.inlineIndex && i < content.length; i++) chars += content[i].text?.length ?? 0;
    return chars + pos.offset;
  }

  #contentTextAt(pos: LogicalPosition): string {
    const block = this.document()[pos.blockIndex];
    if (!block) return '';
    const content = (
      pos.itemIndex !== undefined && this.blocks.get(block.type)?.category === 'container'
        ? ((block.content as ASTBlockNode[])[pos.itemIndex]?.content ?? [])
        : block.content
    ) as ASTInlineNode[];
    return content.map((n) => n.text ?? '').join('');
  }

  #pendingAt(pos: number): ASTMark[] | null {
    const pending = this.pendingMarks();
    return pending && pending.pos === pos ? pending.marks : null;
  }

  register(behavior: BaseBlockBehavior | BaseInlineBehavior) {
    if (behavior instanceof BaseBlockBehavior) this.blocks.set(behavior.type, behavior);
    else this.inlines.set(behavior.type, behavior);
  }

  dispatchWithTruncation(mutation: (draft: ASTDocument, sel: TreeSelection) => TransactionResult | void | null) {
    const flatSel = this.selection.active();
    if (!flatSel) return;

    const oldDoc = this.document();
    const currentSel = this.#toTreeSel(oldDoc, flatSel);
    let targetDoc = oldDoc;
    let targetSel = currentSel;

    if (!currentSel.isCollapsed) {
      const truncation = deleteRange(targetDoc, currentSel, this.blocks);
      targetDoc = truncation.doc;
      if (truncation.selectionShift) targetSel = truncation.selectionShift;
    }

    const result = mutation(targetDoc, targetSel);
    if (result) {
      this.document.set(result.doc);
      if (result.selectionShift) this.selection.live.set(this.#toFlatSel(result.doc, result.selectionShift));
      this.#commit(oldDoc, result.doc, flatSel);
    } else if (!currentSel.isCollapsed) {

      this.document.set(targetDoc);
      this.selection.live.set(this.#toFlatSel(targetDoc, targetSel));
      this.#commit(oldDoc, targetDoc, flatSel);
    }
  }

  handleEscapeHatch(): boolean {
    const flatSel = this.selection.active();
    if (flatSel) {
      const oldDoc = this.document();
      const result = handleEscapeHatch(oldDoc, this.#toTreeSel(oldDoc, flatSel), this.blocks);
      if (result) {
        this.document.set(result.doc);
        if (result.selectionShift) this.selection.live.set(this.#toFlatSel(result.doc, result.selectionShift));
        this.#commit(oldDoc, result.doc, flatSel);
        return true;
      }
    }
    return false;
  }

  handleEnter() {
    this.dispatchWithTruncation((doc, sel) => handleEnter(doc, sel, this.blocks));
  }

  handleBackspace() {
    this.dispatchWithTruncation((doc, sel) => handleBackspace(doc, sel, this.blocks));
  }

  insertText(text: string) {
    const sel = this.selection.active();
    const pending = sel && sel.from === sel.to ? this.#pendingAt(sel.from) : null;
    this.pendingMarks.set(null);
    this.dispatchWithTruncation((doc, s) => {
      const result = executeInsertText(doc, s, text, this.inlines, this.blocks);
      if (!result || !pending) return result;

      const block = result.doc[s.start.blockIndex];
      const isContainer = this.blocks.get(block.type)?.category === 'container';
      const itemIdx = s.start.itemIndex ?? 0;
      const holder = isContainer ? (block.content as ASTBlockNode[])[itemIdx] : block;
      const content = holder.content as ASTInlineNode[];
      let charStart = s.start.offset;
      for (let i = 0; i < s.start.inlineIndex && i < content.length; i++) charStart += content[i].text?.length ?? 0;
      holder.content = spliceInlineContent(content, charStart, text.length, [
        { type: 'text', text, ...(pending.length ? { marks: pending } : {}) },
      ]);
      const resolved = resolveInlinePosition(holder.content as ASTInlineNode[], charStart + text.length);
      const pos: LogicalPosition = { blockIndex: s.start.blockIndex, ...resolved };
      if (isContainer) pos.itemIndex = itemIdx;
      return { doc: result.doc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
    });
  }

  deleteRange() {
    this.dispatchWithTruncation((doc, sel) => deleteRange(doc, sel, this.blocks));
  }

  deleteForward() {
    this.dispatchWithTruncation((doc, sel) => deleteForward(doc, sel, this.blocks));
  }

  readonly activeFormats = computed(() => {
    const doc = this.document();
    const sel = this.selection.active();
    if (!sel)
      return {
        blockType: null as string | null,
        blockAttrs: null as Record<string, any> | null,
        marks: [] as ASTMark[],
      };

    const isCollapsed = sel.from === sel.to;
    const start = this.#lpOf(doc, sel.from);
    const end = isCollapsed ? start : this.#lpOf(doc, sel.to);

    const block = doc[start.blockIndex];
    if (!block) return { blockType: null, blockAttrs: null, marks: [] as ASTMark[] };

    const behavior = this.blocks.get(block.type);
    let content: ASTInlineNode[] | null = null;
    if (behavior?.category === 'container') {
      const item = block.content[start.itemIndex ?? 0] as ASTBlockNode | undefined;
      content = item ? (item.content as ASTInlineNode[]) : null;
    } else if (behavior?.category !== 'void') {
      content = block.content as ASTInlineNode[];
    }

    let marks: ASTMark[] = [];
    if (content) {
      const sameHolder = start.blockIndex === end.blockIndex && (start.itemIndex ?? 0) === (end.itemIndex ?? 0);
      if (!isCollapsed && sameHolder) {

        const a = this.#charOffsetOf(start);
        const b = this.#charOffsetOf(end);
        marks = this.#commonMarks(content, Math.min(a, b), Math.max(a, b));
      } else {
        const inline = content[start.inlineIndex] as ASTInlineNode | undefined;
        marks = inline?.marks ? [...inline.marks] : [];
      }
    }

    if (isCollapsed) {
      const pending = this.#pendingAt(sel.from);
      if (pending) marks = structuredClone(pending);
    }

    return { blockType: block.type, blockAttrs: block.attrs ?? null, marks };
  });

  #commonMarks(content: ASTInlineNode[], startChar: number, endChar: number): ASTMark[] {
    if (endChar <= startChar) return [];
    const key = (m: ASTMark) => JSON.stringify({ t: m.type, a: m.attrs ?? null });
    const overlapping: ASTInlineNode[] = [];
    let at = 0;
    for (const node of content) {
      const len = node.text?.length ?? 0;
      if (at < endChar && at + len > startChar) overlapping.push(node);
      at += len;
    }
    if (overlapping.length === 0) return [];
    let common = overlapping[0].marks ? [...overlapping[0].marks] : [];
    for (let i = 1; i < overlapping.length && common.length; i++) {
      const set = new Set((overlapping[i].marks ?? []).map(key));
      common = common.filter((m) => set.has(key(m)));
    }
    return structuredClone(common);
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
    const doc = this.document();
    const start = this.#lpOf(doc, sel.from);
    const block = doc[start.blockIndex];
    if (!block || this.blocks.get(block.type)?.category === 'void') return null;
    const before = this.#contentTextAt(start).slice(0, this.#charOffsetOf(start));
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
    const oldDoc = this.document();
    const result = toggleMark(oldDoc, sel, markType, attrs, this.blocks, 'add');
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(this.#toFlatSel(result.doc, result.selectionShift));
    this.#commit(oldDoc, result.doc, this.#toFlatSel(oldDoc, sel));
    return true;
  }

  removeMark(markType: string): boolean {
    const sel = this.#markTargetSelection(markType);
    if (!sel) return false;
    this.pendingMarks.set(null);
    const oldDoc = this.document();
    const result = toggleMark(oldDoc, sel, markType, undefined, this.blocks, 'remove');
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(this.#toFlatSel(result.doc, result.selectionShift));
    this.#commit(oldDoc, result.doc, this.#toFlatSel(oldDoc, sel));
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
    const doc = this.document();
    const block = doc[index];
    if (!block || this.blocks.get(block.type)?.category !== 'void') return;
    this.pendingMarks.set(null);
    const pos = logicalToPos(doc, { blockIndex: index, inlineIndex: 0, offset: 0 });
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
    const pos = logicalToPos(newDoc, { blockIndex: caretIdx, inlineIndex: 0, offset: 0 });
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

    const run = this.#expandToMarkRun(this.#lpOf(this.document(), sel.from), markType);
    if (!run) return null;
    const block = this.document()[run.start.blockIndex];
    const isContainer = this.blocks.get(block.type)?.category === 'container';
    const content = (
      isContainer ? ((block.content as ASTBlockNode[])[run.start.itemIndex ?? 0]?.content ?? []) : block.content
    ) as ASTInlineNode[];

    const startChar = this.#charOffsetOf(run.start);
    const endChar = this.#charOffsetOf(run.end);
    let at = 0;
    for (const node of content) {
      const len = node.text?.length ?? 0;
      if (at < endChar && at + len > startChar) {
        const mark = node.marks?.find((m) => m.type === markType);
        if (mark) return structuredClone(mark);
      }
      at += len;
    }
    return null;
  }

  #markTargetSelection(markType: string): TreeSelection | null {
    const sel = this.selection.active();
    if (!sel) return null;
    const doc = this.document();
    if (sel.from !== sel.to) return this.#toTreeSel(doc, sel);
    const run = this.#expandToMarkRun(this.#lpOf(doc, sel.from), markType);
    if (run) this.selection.live.set(this.#toFlatSel(doc, run));
    return run;
  }

  #expandToMarkRun(pos: LogicalPosition, markType: string): TreeSelection | null {
    const block = this.document()[pos.blockIndex];
    if (!block) return null;
    const isContainer = this.blocks.get(block.type)?.category === 'container';
    const itemIdx = pos.itemIndex ?? 0;
    const content = (isContainer ? ((block.content as ASTBlockNode[])[itemIdx]?.content ?? []) : block.content) as ASTInlineNode[];
    const caretChar = this.#charOffsetOf(pos);

    const runs: [number, number][] = [];
    let at = 0;
    for (const node of content) {
      const len = node.text?.length ?? 0;
      const marked = node.marks?.some((m) => m.type === markType) ?? false;
      if (marked && len > 0) {
        const last = runs[runs.length - 1];
        if (last && last[1] === at) last[1] = at + len;
        else runs.push([at, at + len]);
      }
      at += len;
    }
    const run = runs.find(([s, e]) => caretChar >= s && caretChar <= e);
    if (!run) return null;

    const resolve = (char: number) => resolveInlinePosition(content, char);
    const s = resolve(run[0]);
    const e = resolve(run[1]);
    const mk = (r: { inlineIndex: number; offset: number }): LogicalPosition => ({
      blockIndex: pos.blockIndex,
      ...(isContainer ? { itemIndex: itemIdx } : {}),
      inlineIndex: r.inlineIndex,
      offset: r.offset,
    });
    return { start: mk(s), end: mk(e), isCollapsed: false };
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
    const oldDoc = this.document();
    const result = toggleMark(oldDoc, this.#toTreeSel(oldDoc, currentSel), markType, attrs, this.blocks);
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(this.#toFlatSel(result.doc, result.selectionShift));
    this.#commit(oldDoc, result.doc, currentSel);
  }

  insertFragment(fragment: ASTDocument) {
    this.dispatchWithTruncation((doc, sel) => insertFragment(doc, sel, fragment, this.blocks));
  }

  setBlockType(type: string, attrs?: any) {
    const currentSel = this.selection.active();
    if (!currentSel) return;

    const oldDoc = this.document();
    const result = setBlockType(oldDoc, this.#toTreeSel(oldDoc, currentSel), type, this.blocks, attrs);
    if (result) {
      this.document.set(result.doc);
      if (result.selectionShift) this.selection.live.set(this.#toFlatSel(result.doc, result.selectionShift));
      this.#commit(oldDoc, result.doc, currentSel);
    }
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
    this.document.set(applyOp(this.document(), tx.op));
    this.#advanceColumnar(tx.op);
    if (tx.selAfter) this.selection.live.set({ ...tx.selAfter });
    this.#undoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  applyRemoteOperation(op: EditorOp) {
    const oldDoc = this.document();
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
    this.#advanceColumnar(op);
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
