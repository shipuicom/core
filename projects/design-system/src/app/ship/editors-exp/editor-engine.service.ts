import { Injectable, computed, inject, signal } from '@angular/core';
import {
  deleteForward,
  deleteRange,
  executeInsertText,
  handleBackspace,
  handleEnter,
  handleEscapeHatch,
  insertFragment,
  setBlockType,
  toggleMark,
} from './editor-ast.utils';
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { astToHtml, astToMarkdown } from './editor-serializers';
import { diffFlat, logicalToPos, posToLogical } from './editor-flat-positions';
import { EditorOp, EditorTransaction, applyOp, diffDocuments, invertOp, transformOp } from './editor-transactions';
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
    this.dispatchWithTruncation((doc, sel) => executeInsertText(doc, sel, text, this.inlines, this.blocks));
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

    let marks: ASTMark[] = [];
    const behavior = this.blocks.get(block.type);

    if (behavior?.category === 'container') {
      const itemIdx = sel.start.itemIndex ?? 0;
      const item = block.content[itemIdx] as ASTBlockNode | undefined;
      if (item) {
        const inline = (item.content as ASTInlineNode[])[sel.start.inlineIndex] as ASTInlineNode | undefined;
        marks = inline?.marks ? [...inline.marks] : [];
      }
    } else if (behavior?.category !== 'void') {
      const content = block.content as ASTInlineNode[];
      const inline = content[sel.start.inlineIndex] as ASTInlineNode | undefined;
      marks = inline?.marks ? [...inline.marks] : [];
    }

    return { blockType: block.type, blockAttrs: block.attrs ?? null, marks };
  });

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

  // --- GENERIC DISPATCH ---
  dispatch(action: string, attrs?: Record<string, any>) {
    if (this.blocks.has(action)) this.setBlockType(action, attrs);
    else if (this.inlines.has(action)) this.toggleMark(action, attrs);
    else if (action === 'undo') this.undo();
    else if (action === 'redo') this.redo();
  }

  toggleMark(markType: string, attrs?: Record<string, any>) {
    const currentSel = this.selection.active();
    if (!currentSel || currentSel.isCollapsed) return;

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
