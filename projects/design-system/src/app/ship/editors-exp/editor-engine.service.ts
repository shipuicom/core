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
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { astToHtml, astToMarkdown } from './editor-serializers';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { EditorOp, EditorTransaction, applyOp, diffDocuments, invertOp, spliceInlineContent, transformOp } from './editor-transactions';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalPosition, LogicalSelection, TransactionResult } from './editor.types';
import { EditorSelectionService } from './selection.service';

@Injectable()
export class EditorEngineService {
  readonly selection = inject(EditorSelectionService);

  readonly document = signal<ASTDocument>([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
  readonly blocks = new Map<string, BaseBlockBehavior>();
  readonly inlines = new Map<string, BaseInlineBehavior>();

  /**
   * Invertible history: stacks of operations, not snapshots. Undo applies the
   * inverse splice of the last transaction; redo re-applies it forward. Memory
   * scales with the blocks each edit touched, not with document size.
   */
  #undoStack = signal<EditorTransaction[]>([]);
  #redoStack = signal<EditorTransaction[]>([]);

  /** Monotonic document version; each committed transaction advances it. */
  readonly version = signal(0);
  /** The most recently committed transaction — plain JSON, so a future collab
   * layer can subscribe here and ship it to peers verbatim. */
  readonly lastTransaction = signal<EditorTransaction | null>(null);

  readonly canUndo = computed(() => this.#undoStack().length > 0);
  readonly canRedo = computed(() => this.#redoStack().length > 0);

  /**
   * PM-style stored marks. Toggling a mark at a COLLAPSED caret can't restyle
   * a range — instead the desired mark set is parked here and applied to the
   * next text inserted at that exact spot ("Cmd+B, type" produces bold text).
   * The anchor compares by character offset (a caret at a node boundary has
   * two inlineIndex/offset spellings); a pending set at any other position is
   * simply never applied, so stale entries self-expire.
   */
  readonly pendingMarks = signal<{
    blockIndex: number;
    itemIndex: number;
    charOffset: number;
    marks: ASTMark[];
  } | null>(null);

  /** Character offset of a logical position within its block/item content. */
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

  #pendingAt(pos: LogicalPosition): ASTMark[] | null {
    const pending = this.pendingMarks();
    if (!pending) return null;
    const matches =
      pending.blockIndex === pos.blockIndex &&
      pending.itemIndex === (pos.itemIndex ?? 0) &&
      pending.charOffset === this.#charOffsetOf(pos);
    return matches ? pending.marks : null;
  }

  register(behavior: BaseBlockBehavior | BaseInlineBehavior) {
    if (behavior instanceof BaseBlockBehavior) this.blocks.set(behavior.type, behavior);
    else this.inlines.set(behavior.type, behavior);
  }

  // RANGE TRUNCATION WRAPPER
  dispatchWithTruncation(mutation: (draft: ASTDocument, sel: LogicalSelection) => TransactionResult | void | null) {
    const currentSel = this.selection.active();
    if (!currentSel) return;

    const oldDoc = this.document();
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
      if (result.selectionShift) this.selection.live.set(result.selectionShift);
      this.#commit(oldDoc, result.doc, currentSel);
    } else if (!currentSel.isCollapsed) {
      // Action was No-op but Truncation happened
      this.document.set(targetDoc);
      this.selection.live.set(targetSel);
      this.#commit(oldDoc, targetDoc, currentSel);
    }
  }

  // --- CORE AXIOMS ---
  handleEscapeHatch(): boolean {
    const currentSel = this.selection.active();
    if (currentSel) {
      const oldDoc = this.document();
      const result = handleEscapeHatch(oldDoc, currentSel, this.blocks);
      if (result) {
        this.document.set(result.doc);
        if (result.selectionShift) this.selection.live.set(result.selectionShift);
        this.#commit(oldDoc, result.doc, currentSel);
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
    const pending = sel?.isCollapsed ? this.#pendingAt(sel.start) : null;
    this.pendingMarks.set(null); // consumed or stale either way
    this.dispatchWithTruncation((doc, s) => {
      const result = executeInsertText(doc, s, text, this.inlines, this.blocks);
      if (!result || !pending) return result;
      // Re-mark the inserted characters with the stored mark set, then re-seat
      // the caret by char offset (marking may have re-split the inline nodes).
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

  // --- ACTIVE STATE ---
  readonly activeFormats = computed(() => {
    const doc = this.document();
    const sel = this.selection.active();
    if (!sel)
      return {
        blockType: null as string | null,
        blockAttrs: null as Record<string, any> | null,
        marks: [] as ASTMark[],
      };

    const block = doc[sel.start.blockIndex];
    if (!block) return { blockType: null, blockAttrs: null, marks: [] as ASTMark[] };

    const behavior = this.blocks.get(block.type);
    let content: ASTInlineNode[] | null = null;
    if (behavior?.category === 'container') {
      const item = block.content[sel.start.itemIndex ?? 0] as ASTBlockNode | undefined;
      content = item ? (item.content as ASTInlineNode[]) : null;
    } else if (behavior?.category !== 'void') {
      content = block.content as ASTInlineNode[];
    }

    let marks: ASTMark[] = [];
    if (content) {
      const sameHolder =
        sel.start.blockIndex === sel.end.blockIndex && (sel.start.itemIndex ?? 0) === (sel.end.itemIndex ?? 0);
      if (!sel.isCollapsed && sameHolder) {
        // Range: a mark is active only if EVERY selected character carries it
        // (identity = type + attrs, so two differently-href'd links don't count
        // as one active link). Also fixes the boundary case where sel.start
        // resolves into the plain node just before a selected mark run.
        const a = this.#charOffsetOf(sel.start);
        const b = this.#charOffsetOf(sel.end);
        marks = this.#commonMarks(content, Math.min(a, b), Math.max(a, b));
      } else {
        const inline = content[sel.start.inlineIndex] as ASTInlineNode | undefined;
        marks = inline?.marks ? [...inline.marks] : [];
      }
    }

    // A pending (stored) mark set at the caret overrides what the text carries,
    // so the toolbar reflects what the NEXT typed character will get.
    if (sel.isCollapsed) {
      const pending = this.#pendingAt(sel.start);
      if (pending) marks = structuredClone(pending);
    }

    return { blockType: block.type, blockAttrs: block.attrs ?? null, marks };
  });

  /** Marks carried by EVERY character in [startChar, endChar) of `content`
   * (identity by type + attrs). Empty range or no overlap → []. */
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

  /**
   * A mark action that needs input UI before it can commit (e.g. 'link' needs
   * an href). Emitted by dispatch() when the behavior sets `requestsUi`; a UI
   * component (sh-editor-link-popover) reacts, collects attrs, and commits via
   * setMark/removeMark. `token` makes consecutive requests distinct.
   */
  readonly uiRequest = signal<{ action: string; token: number } | null>(null);
  #uiToken = 0;

  // --- GENERIC DISPATCH ---
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

  /**
   * Force-apply a mark with these attrs over the selection (replacing an
   * existing same-type mark, so editing a link's href works). A collapsed
   * caret inside a run of the mark expands to the whole contiguous run —
   * "edit the link under the caret" without selecting it first.
   * Returns false when there is nothing to apply to.
   */
  setMark(markType: string, attrs?: Record<string, any>): boolean {
    const sel = this.#markTargetSelection(markType);
    if (!sel) return false;
    this.pendingMarks.set(null);
    const oldDoc = this.document();
    const result = toggleMark(oldDoc, sel, markType, attrs, this.blocks, 'add');
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(result.selectionShift);
    this.#commit(oldDoc, result.doc, sel);
    return true;
  }

  /** Force-remove a mark from the selection (or the run under the caret). */
  removeMark(markType: string): boolean {
    const sel = this.#markTargetSelection(markType);
    if (!sel) return false;
    this.pendingMarks.set(null);
    const oldDoc = this.document();
    const result = toggleMark(oldDoc, sel, markType, undefined, this.blocks, 'remove');
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(result.selectionShift);
    this.#commit(oldDoc, result.doc, sel);
    return true;
  }

  /**
   * Insert text carrying these marks as ONE transaction — rides the stored-
   * marks pipeline. Used by the link popover when the caret isn't on any text
   * to mark (type a URL into the popover → linked text appears).
   */
  insertTextWithMarks(text: string, marks: ASTMark[]) {
    const sel = this.selection.active();
    if (!sel || !sel.isCollapsed) return;
    this.pendingMarks.set({
      blockIndex: sel.start.blockIndex,
      itemIndex: sel.start.itemIndex ?? 0,
      charOffset: this.#charOffsetOf(sel.start),
      marks: structuredClone(marks),
    });
    this.insertText(text);
  }

  // =========================================================================
  // VOID BLOCK (IMAGE) SELECTION & EDITING
  // =========================================================================

  /**
   * Index of a currently-selected void block (an image), or null. A void block
   * has no text caret, so "selecting" it is a separate mode: its contextual
   * toolbar shows while this is set, and Backspace/Delete removes it. Cleared
   * when the caret re-enters text or an edit happens elsewhere.
   */
  readonly selectedBlock = signal<number | null>(null);

  /** The selected void block's AST node, or null. */
  readonly selectedBlockNode = computed(() => {
    const i = this.selectedBlock();
    return i !== null ? (this.document()[i] ?? null) : null;
  });

  /** Select a void block by index (no-op for non-void blocks). */
  selectBlock(index: number) {
    const block = this.document()[index];
    if (!block || this.blocks.get(block.type)?.category !== 'void') return;
    this.pendingMarks.set(null);
    const pos: LogicalPosition = { blockIndex: index, inlineIndex: 0, offset: 0 };
    this.selection.live.set({ start: pos, end: pos, isCollapsed: true });
    this.selectedBlock.set(index);
  }

  clearBlockSelection() {
    if (this.selectedBlock() !== null) this.selectedBlock.set(null);
  }

  #isTextBlockEmpty(block: ASTBlockNode): boolean {
    const c = block.content as ASTInlineNode[];
    return c.length === 0 || (c.length === 1 && c[0].text === '');
  }

  /**
   * Insert an image (void block) at the caret. Replaces the current block if it
   * is an empty paragraph, else inserts on its own line after it, always with a
   * trailing empty paragraph so the image is never the last block (nowhere to
   * type). The new image is left selected so its contextual toolbar appears.
   */
  insertImage(attrs: Record<string, unknown>) {
    const sel = this.selection.active();
    if (!sel) return;
    const oldDoc = this.document();
    let doc = oldDoc;
    let base = sel;
    if (!sel.isCollapsed) {
      const t = deleteRange(oldDoc, sel, this.blocks);
      doc = t.doc;
      base = t.selectionShift ?? sel;
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

  /** Merge attrs into the selected image (mode/size/alt/src), as a transaction. */
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

  /** Remove the selected void block; drop the selection and place the caret. */
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
    const pos: LogicalPosition = { blockIndex: caretIdx, inlineIndex: 0, offset: 0 };
    this.selection.live.set({ start: pos, end: pos, isCollapsed: true });
    this.#commit(oldDoc, newDoc, this.selection.active());
  }

  /**
   * The mark instance the current selection "is on", boundary-inclusive: a
   * direct hit at the selection start, or — for a collapsed caret sitting at
   * either EDGE of a run (where activeFormats resolves into the neighboring
   * node) — the run's mark. This is what editing UIs must use to prefill:
   * anywhere `setMark`/`removeMark` would act on a run, this returns its mark.
   */
  markAtSelection(markType: string): ASTMark | null {
    const sel = this.selection.active();
    if (!sel) return null;
    const direct = this.activeFormats().marks.find((m) => m.type === markType);
    if (direct) return structuredClone(direct);
    if (!sel.isCollapsed) return null;

    const run = this.#expandToMarkRun(sel.start, markType);
    if (!run) return null;
    const block = this.document()[run.start.blockIndex];
    const isContainer = this.blocks.get(block.type)?.category === 'container';
    const content = (
      isContainer ? ((block.content as ASTBlockNode[])[run.start.itemIndex ?? 0]?.content ?? []) : block.content
    ) as ASTInlineNode[];
    // Only nodes inside THIS run — a block can hold several distinct links.
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

  /** The selection a setMark/removeMark should operate on: the live selection,
   * or — for a collapsed caret — the contiguous run of `markType` around it. */
  #markTargetSelection(markType: string): LogicalSelection | null {
    const sel = this.selection.active();
    if (!sel) return null;
    if (!sel.isCollapsed) return sel;
    const run = this.#expandToMarkRun(sel.start, markType);
    if (run) this.selection.live.set(run);
    return run;
  }

  /** Contiguous char range around `pos` whose nodes all carry `markType`. */
  #expandToMarkRun(pos: LogicalPosition, markType: string): LogicalSelection | null {
    const block = this.document()[pos.blockIndex];
    if (!block) return null;
    const isContainer = this.blocks.get(block.type)?.category === 'container';
    const itemIdx = pos.itemIndex ?? 0;
    const content = (isContainer ? ((block.content as ASTBlockNode[])[itemIdx]?.content ?? []) : block.content) as ASTInlineNode[];
    const caretChar = this.#charOffsetOf(pos);

    // Collect contiguous [start, end) char ranges carrying the mark, then take
    // the one the caret touches (inclusive at both edges).
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

    if (currentSel.isCollapsed) {
      // Stored marks: toggle within the pending set for the next insertion.
      const base = this.#pendingAt(currentSel.start) ?? this.activeFormats().marks;
      const has = base.some((m) => m.type === markType);
      const marks = has
        ? base.filter((m) => m.type !== markType)
        : [...base, { type: markType, ...(attrs ? { attrs } : {}) } as ASTMark];
      this.pendingMarks.set({
        blockIndex: currentSel.start.blockIndex,
        itemIndex: currentSel.start.itemIndex ?? 0,
        charOffset: this.#charOffsetOf(currentSel.start),
        marks: structuredClone(marks),
      });
      return;
    }

    this.pendingMarks.set(null);
    const oldDoc = this.document();
    const result = toggleMark(oldDoc, currentSel, markType, attrs, this.blocks);
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(result.selectionShift);
    this.#commit(oldDoc, result.doc, currentSel);
  }

  insertFragment(fragment: ASTDocument) {
    this.dispatchWithTruncation((doc, sel) => insertFragment(doc, sel, fragment, this.blocks));
  }

  // --- STANDARD TRANSACTIONS ---
  setBlockType(type: string, attrs?: any) {
    const currentSel = this.selection.active();
    if (!currentSel) return;

    let targetDoc = this.document();
    let targetSel = currentSel;
    if (!currentSel.isCollapsed) {
      const truncation = deleteRange(targetDoc, currentSel, this.blocks);
      targetDoc = truncation.doc;
      if (truncation.selectionShift) targetSel = truncation.selectionShift;
    }

    const oldDoc = this.document();
    const result = setBlockType(oldDoc, currentSel, type, this.blocks, attrs);
    if (result) {
      this.document.set(result.doc);
      if (result.selectionShift) this.selection.live.set(result.selectionShift);
      this.#commit(oldDoc, result.doc, currentSel);
    }
  }

  serialize(format: 'html' | 'json' | 'markdown'): any {
    if (format === 'json') return structuredClone(this.document());
    if (format === 'markdown') return astToMarkdown(this.document(), this.blocks, this.inlines);
    return astToHtml(this.document(), this.blocks, this.inlines);
  }

  reset(doc: ASTDocument) {
    // A reset (external value set) is itself an invertible transaction — the
    // splice replaces the whole old document, so undo returns to it.
    const oldDoc = this.document();
    this.document.set(doc);
    this.#commit(oldDoc, doc, null);
  }

  /**
   * Commit an externally-produced document (e.g. the post-IME block reconcile,
   * which reads composed text back from the DOM). Diffs against the current
   * document so the composition becomes a normal, undoable transaction.
   */
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
    this.document.set(applyOp(this.document(), invertOp(tx.op)));
    if (tx.selBefore) this.selection.live.set(structuredClone(tx.selBefore));
    this.#redoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  redo() {
    const stack = this.#redoStack();
    const tx = stack[stack.length - 1];
    if (!tx) return;
    this.#redoStack.set(stack.slice(0, -1));
    this.document.set(applyOp(this.document(), tx.op));
    if (tx.selAfter) this.selection.live.set(structuredClone(tx.selAfter));
    this.#undoStack.update((s) => [...s, tx]);
    this.version.update((v) => v + 1);
  }

  /**
   * Apply an operation produced elsewhere (a collaborating peer) WITHOUT
   * entering local undo history — you can't Cmd+Z someone else's edit.
   *
   * Rebasing here is the op-sequence LADDER, not a flat per-entry transform:
   * only the top undo entry shares the remote op's coordinate frame — deeper
   * entries are expressed against deeper document states. Walking the undo
   * stack top→bottom, the remote op is localized into each deeper frame by
   * transforming it through the entry's INVERSE, and each entry rebases
   * against the remote op as seen at its own depth (side 'right': applyOp
   * inserts remote content before existing content at an equal point, so a
   * tied local insert shifts after it — the fuzz marker oracle catches both
   * the 'left' variant and the missing ladder deleting a peer's character).
   * The redo stack is the mirror image, walking away from the tip. A conflict
   * at any rung truncates that entry and everything beyond it — undo depth is
   * lost, correctness never.
   *
   * The live selection and caret snapshots map through the FLAT StepMap
   * diffed from the actual before/after documents, which recovers exact
   * correspondence even when the wire op is coarse (a merge arriving as a
   * whole-block splice still maps interior carets to the right character).
   */
  applyRemoteOperation(op: EditorOp) {
    const oldDoc = this.document();
    const newDoc = applyOp(oldDoc, op);
    const map = diffFlat(oldDoc, newDoc);
    if (!map) return; // semantic no-op — leave doc, history, and carets alone
    this.document.set(newDoc);

    // assoc -1: a remote insert exactly at a caret lands after it (the caret
    // stays anchored to the text it was in front of).
    const mapLp = (lp: LogicalPosition | null | undefined): LogicalPosition | null =>
      lp ? posToLogical(newDoc, map.map(logicalToPos(oldDoc, lp), -1)) : null;
    const mapSel = (sel: LogicalSelection | null): LogicalSelection | null => {
      if (!sel) return null;
      const start = mapLp(sel.start);
      const end = sel.isCollapsed ? start : mapLp(sel.end);
      return start && end ? { start, end, isCollapsed: sel.isCollapsed } : null;
    };

    const live = mapSel(this.selection.active());
    if (live) this.selection.live.set(live);

    // Undo stack (index 0 = oldest, end = top/next-to-undo). Rebase the UNDO
    // CHAIN in inverse space: U1=invert(top) is valid at the tip — the same
    // frame as the remote op — U2 at the frame after U1, and so on, so every
    // transform happens in a frame where both operands are actually
    // expressed. (Localizing the remote op down through inverses instead
    // collapses distinct orderings at coincident positions — the fuzz marker
    // oracle caught it undoing a peer's character.)
    this.#undoStack.update((stack) => {
      const out: EditorTransaction[] = [];
      let remote: EditorOp = op;
      for (let k = stack.length - 1; k >= 0; k--) {
        const tx = stack[k];
        const inverse = invertOp(tx.op);
        const rebasedInverse = transformOp(inverse, remote, 'right');
        const remoteNext = rebasedInverse ? transformOp(remote, inverse, 'left') : null;
        if (!rebasedInverse || !remoteNext) return out.reverse(); // truncate k and deeper
        out.push({ ...tx, op: invertOp(rebasedInverse), selBefore: mapSel(tx.selBefore), selAfter: mapSel(tx.selAfter) });
        remote = remoteNext;
      }
      return out.reverse();
    });

    // Redo stack (end = next-to-redo, based at the tip). Localize the remote
    // op upward through the entries as they would re-apply.
    this.#redoStack.update((stack) => {
      const out: EditorTransaction[] = [];
      let remote: EditorOp = op;
      for (let k = stack.length - 1; k >= 0; k--) {
        const tx = stack[k];
        const rebased = transformOp(tx.op, remote, 'right');
        const remoteAbove = rebased ? transformOp(remote, tx.op, 'left') : null;
        if (!rebased || !remoteAbove) return out.reverse(); // truncate k and beyond
        out.push({ ...tx, op: rebased, selBefore: mapSel(tx.selBefore), selAfter: mapSel(tx.selAfter) });
        remote = remoteAbove;
      }
      return out.reverse();
    });
    this.version.update((v) => v + 1);
  }

  /**
   * Record one invertible transaction: diff old→new into the minimal operation
   * (char-level inside a single text block, block-level otherwise), push it
   * onto the undo stack, and clear the redo stack. A no-op mutation records
   * nothing.
   */
  #commit(oldDoc: ASTDocument, newDoc: ASTDocument, selBefore: LogicalSelection | null) {
    const op = diffDocuments(oldDoc, newDoc);
    if (!op) return;
    const selAfter = this.selection.active();
    const tx: EditorTransaction = {
      baseVersion: this.version(),
      op,
      selBefore: selBefore ? structuredClone(selBefore) : null,
      selAfter: selAfter ? structuredClone(selAfter) : null,
    };
    this.#undoStack.update((s) => [...s, tx]);
    if (this.#redoStack().length) this.#redoStack.set([]);
    this.version.update((v) => v + 1);
    this.lastTransaction.set(tx);
  }
}
