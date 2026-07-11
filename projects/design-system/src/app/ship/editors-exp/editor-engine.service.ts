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
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalSelection, TransactionResult } from './editor.types';
import { EditorSelectionService } from './selection.service';

@Injectable()
export class EditorEngineService {
  readonly selection = inject(EditorSelectionService);

  readonly document = signal<ASTDocument>([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
  readonly blocks = new Map<string, BaseBlockBehavior>();
  readonly inlines = new Map<string, BaseInlineBehavior>();

  #history: { doc: ASTDocument; sel: LogicalSelection | null }[] = [];
  #historyIndex = -1;

  readonly canUndo = computed(() => this.#historyIndex > 0);
  readonly canRedo = computed(() => this.#historyIndex < this.#history.length - 1);

  constructor() {
    this.pushHistory(this.document(), null);
  }

  register(behavior: BaseBlockBehavior | BaseInlineBehavior) {
    if (behavior instanceof BaseBlockBehavior) this.blocks.set(behavior.type, behavior);
    else this.inlines.set(behavior.type, behavior);
  }

  // RANGE TRUNCATION WRAPPER
  dispatchWithTruncation(mutation: (draft: ASTDocument, sel: LogicalSelection) => TransactionResult | void | null) {
    const currentSel = this.selection.active();
    if (!currentSel) return;

    let targetDoc = this.document();
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
      this.pushHistory(result.doc, this.selection.active());
    } else if (!currentSel.isCollapsed) {
      // Action was No-op but Truncation happened
      this.document.set(targetDoc);
      this.selection.live.set(targetSel);
      this.pushHistory(targetDoc, targetSel);
    }
  }

  // --- CORE AXIOMS ---
  handleEscapeHatch(): boolean {
    const currentSel = this.selection.active();
    if (currentSel) {
      const result = handleEscapeHatch(this.document(), currentSel, this.blocks);
      if (result) {
        this.document.set(result.doc);
        if (result.selectionShift) this.selection.live.set(result.selectionShift);
        this.pushHistory(result.doc, this.selection.active());
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

    const result = toggleMark(this.document(), currentSel, markType, attrs, this.blocks);
    this.document.set(result.doc);
    if (result.selectionShift) this.selection.live.set(result.selectionShift);
    this.pushHistory(result.doc, this.selection.active());
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

    const result = setBlockType(this.document(), currentSel, type, this.blocks, attrs);
    if (result) {
      this.document.set(result.doc);
      if (result.selectionShift) this.selection.live.set(result.selectionShift);
      this.pushHistory(result.doc, this.selection.active());
    }
  }

  serialize(format: 'html' | 'json' | 'markdown'): any {
    if (format === 'json') return structuredClone(this.document());
    if (format === 'markdown') return astToMarkdown(this.document(), this.blocks, this.inlines);
    return astToHtml(this.document(), this.blocks, this.inlines);
  }

  reset(doc: ASTDocument) {
    this.document.set(doc);
    this.pushHistory(doc, null);
  }

  undo() {
    if (!this.canUndo()) return;
    this.#historyIndex--;
    const state = this.#history[this.#historyIndex];
    this.document.set(structuredClone(state.doc));
    if (state.sel) this.selection.live.set(state.sel);
  }

  redo() {
    if (!this.canRedo()) return;
    this.#historyIndex++;
    const state = this.#history[this.#historyIndex];
    this.document.set(structuredClone(state.doc));
    if (state.sel) this.selection.live.set(state.sel);
  }

  private pushHistory(doc: ASTDocument, sel: LogicalSelection | null) {
    this.#history = this.#history.slice(0, this.#historyIndex + 1);
    this.#history.push({ doc: structuredClone(doc), sel: sel ? structuredClone(sel) : null });
    this.#historyIndex++;
  }
}
