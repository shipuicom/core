import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteBackward, deleteRange, exitCodeBlock, exitList, insertBlockAbove, insertFragment, insertText, listEnter, resolveContainerPosition, setBlockType, splitBlock, splitListItem, toggleMark, wrapInList, unwrapFromList } from './editor-ast.utils';
import { EditorEngineService } from './editor-engine.service';
import { htmlToAst, parseDOMToAST } from './editor-serializers';
import { ASTDocument, ASTInlineNode, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { BoldBehavior, CodeBlockBehavior, InfoCalloutBehavior, ParagraphBehavior } from './standard-behaviors';

describe('Editor Architecture & AST', () => {
  describe('AST Utilities (Pure Functions)', () => {
    let doc: ASTDocument;

    it('should toggle a block type back to paragraph if it matches', () => {
      // 1. Start with a paragraph
      doc = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      // 2. Turn into H1
      let res = setBlockType(doc, sel, 'heading', { level: 1 });
      expect(res.doc[0].type).toBe('heading');
      expect(res.doc[0].attrs?.['level']).toBe(1);

      // 3. Try turning into H1 again (Toggle OFF)
      res = setBlockType(res.doc, sel, 'heading', { level: 1 });
      expect(res.doc[0].type).toBe('paragraph'); // Reverted!
      expect(res.doc[0].attrs?.['level']).toBeUndefined();

      // 4. Turn into H2 (From paragraph)
      res = setBlockType(res.doc, sel, 'heading', { level: 2 });
      expect(res.doc[0].type).toBe('heading');
      expect(res.doc[0].attrs?.['level']).toBe(2);

      // 5. Try turning into H1 (Toggle Switch from H2 -> H1 without toggling off)
      res = setBlockType(res.doc, sel, 'heading', { level: 1 });
      expect(res.doc[0].type).toBe('heading');
      expect(res.doc[0].attrs?.['level']).toBe(1);
    });

    it('should insert text into a block', () => {
      doc = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: true,
      };

      const res = insertText(doc, sel, ' World');
      expect((res.doc[0].content[0] as any).text).toBe('Hello World');
      expect(res.selectionShift?.start.offset).toBe(11);
    });

    it('should split a block on Enter', () => {
      doc = [{ type: 'paragraph', content: [{ type: 'text', text: 'HelloWorld' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: true,
      };

      const res = splitBlock(doc, sel);
      expect(res.doc.length).toBe(2);
      expect((res.doc[0].content[0] as any).text).toBe('Hello');
      expect((res.doc[1].content[0] as any).text).toBe('World');
      expect(res.doc[1].type).toBe('paragraph');
      expect(res.selectionShift?.start.blockIndex).toBe(1);
    });

    it('should change block type across a selection', () => {
      doc = [{ type: 'paragraph', content: [] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const res = setBlockType(doc, sel, 'code-block');
      expect(res.doc[0].type).toBe('code-block');
    });

    it('should delete text within the same block', () => {
      doc = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 11 },
        isCollapsed: false,
      };

      const result = deleteRange(doc, sel);
      expect(result.doc.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('Hello');
    });

    it('should handle complex cross-block deletion and merge blocks', () => {
      doc = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Line One' }] },
        { type: 'code-block', content: [{ type: 'text', text: 'Line Two' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Line Three' }] },
      ];

      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 2, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      };

      const result = deleteRange(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
      expect((result.doc[0].content[0] as any).text).toBe('Line Three');
    });

    it('should merge current block into previous block when Backspacing at index 0', () => {
      doc = [
        { type: 'heading', content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
      ];

      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('heading');
      expect((result.doc[0].content[0] as any).text).toBe('TitleBody');
      expect(result.selectionShift?.start.blockIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(5);
    });
  });

  // ============================================================
  // BUG #1: Backspace at inline boundary (offset=0, inlineIndex>0)
  // ============================================================
  describe('Bug #1: deleteBackward at inline node boundary', () => {
    it('should delete last char of previous inline node when caret is at offset=0 of a non-first inline', () => {
      const doc: ASTDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'World' },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 1, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 1, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect((result.doc[0].content[0] as any).text).toBe('Hell');
      expect((result.doc[0].content[1] as any).text).toBe('World');
      expect(result.selectionShift?.start.inlineIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(4);
    });

    it('should remove empty inline node after backspacing its last character', () => {
      const doc: ASTDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'X', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'Rest' },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 1, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 1, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc[0].content.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('Rest');
      expect(result.selectionShift?.start.inlineIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(0);
    });
  });

  // ============================================================
  // BUG #4: Block merge doesn't normalise adjacent same-mark nodes
  // ============================================================
  describe('Bug #4: Block merge inline node normalisation', () => {
    it('should merge adjacent inline nodes with identical marks after block merge', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello', marks: [{ type: 'bold' }] }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World', marks: [{ type: 'bold' }] }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].content.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('HelloWorld');
      expect((result.doc[0].content[0] as any).marks).toEqual([{ type: 'bold' }]);
    });

    it('should keep separate inline nodes when marks differ after block merge', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello', marks: [{ type: 'bold' }] }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].content.length).toBe(2);
      expect((result.doc[0].content[0] as any).text).toBe('Hello');
      expect((result.doc[0].content[1] as any).text).toBe('World');
    });
  });

  // ============================================================
  // BUG #6: splitBlock should delete selection first
  // ============================================================
  describe('Bug #6: splitBlock with non-collapsed selection', () => {
    it('should delete the selected text before splitting the block', () => {
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello Beautiful World' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 6 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 16 },
        isCollapsed: false,
      };

      const result = splitBlock(doc, sel);
      expect(result.doc.length).toBe(2);
      expect((result.doc[0].content[0] as any).text).toBe('Hello ');
      expect((result.doc[1].content[0] as any).text).toBe('World');
      expect(result.selectionShift?.start.blockIndex).toBe(1);
      expect(result.selectionShift?.start.offset).toBe(0);
    });

    it('should handle splitBlock with cross-inline selection', () => {
      const doc: ASTDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'Beautiful' },
            { type: 'text', text: ' World' },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 1, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 1, offset: 9 },
        isCollapsed: false,
      };

      const result = splitBlock(doc, sel);
      expect(result.doc.length).toBe(2);
      expect((result.doc[0].content[0] as any).text).toBe('Hello ');
      expect((result.doc[1].content[0] as any).text).toBe(' World');
    });
  });

  // ============================================================
  // BUG #3: deleteRange across multiple inline nodes in same block
  // ============================================================
  describe('Bug #3: deleteRange across multiple inline nodes', () => {
    it('should correctly delete across three inline nodes within the same block', () => {
      const doc: ASTDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'AAA', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'BBB' },
            { type: 'text', text: 'CCC', marks: [{ type: 'italic' }] },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 1 },
        end: { blockIndex: 0, inlineIndex: 2, offset: 2 },
        isCollapsed: false,
      };

      const result = deleteRange(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].content.length).toBe(2);
      expect((result.doc[0].content[0] as any).text).toBe('A');
      expect((result.doc[0].content[0] as any).marks).toEqual([{ type: 'bold' }]);
      expect((result.doc[0].content[1] as any).text).toBe('C');
      expect((result.doc[0].content[1] as any).marks).toEqual([{ type: 'italic' }]);
    });

    it('should handle deleteRange spanning exactly two inlines', () => {
      const doc: ASTDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'World' },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        end: { blockIndex: 0, inlineIndex: 1, offset: 3 },
        isCollapsed: false,
      };

      const result = deleteRange(doc, sel);
      expect(result.doc[0].content.length).toBe(2);
      expect((result.doc[0].content[0] as any).text).toBe('Hel');
      expect((result.doc[0].content[1] as any).text).toBe('ld');
    });
  });

  // ============================================================
  // BUG #17: deleteForward (Delete key) support
  // ============================================================
  describe('Bug #17: deleteForward', () => {
    it('should delete the character after the caret position', async () => {
      const { deleteForward } = await import('./editor-ast.utils');
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 2 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 2 },
        isCollapsed: true,
      };

      const result = deleteForward(doc, sel);
      expect((result.doc[0].content[0] as any).text).toBe('Helo');
      expect(result.selectionShift?.start.offset).toBe(2);
    });

    it('should merge with next block when at end of current block', async () => {
      const { deleteForward } = await import('./editor-ast.utils');
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: true,
      };

      const result = deleteForward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('HelloWorld');
      expect(result.selectionShift?.start.offset).toBe(5);
    });

    it('should do nothing when at end of last block', async () => {
      const { deleteForward } = await import('./editor-ast.utils');
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: true,
      };

      const result = deleteForward(doc, sel);
      expect((result.doc[0].content[0] as any).text).toBe('Hello');
    });

    it('should delete the selection when not collapsed', async () => {
      const { deleteForward } = await import('./editor-ast.utils');
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 11 },
        isCollapsed: false,
      };

      const result = deleteForward(doc, sel);
      expect((result.doc[0].content[0] as any).text).toBe('Hello');
    });
  });

  // ============================================================
  // BUG #5: parseDOMToAST with contenteditable="false"
  // ============================================================
  describe('Bug #5: parseDOMToAST skips contenteditable=false elements', () => {
    it('should not include contenteditable=false span text in parsed inline content', () => {
      const blocks = new Map();
      const inlines = new Map();
      blocks.set('paragraph', new ParagraphBehavior());
      blocks.set('info-callout', new InfoCalloutBehavior());
      inlines.set('bold', new BoldBehavior());

      const container = document.createElement('div');
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'sh-editor-callout sh-editor-callout-info';
      const iconSpan = document.createElement('span');
      iconSpan.className = 'sh-editor-callout-icon';
      iconSpan.setAttribute('contenteditable', 'false');
      iconSpan.textContent = '💡';
      blockquote.appendChild(iconSpan);
      blockquote.appendChild(document.createTextNode('Some callout text'));
      container.appendChild(blockquote);

      const result = parseDOMToAST(container, blocks, inlines);
      const allText = result[0].content.map((n: any) => n.text).join('');
      expect(allText).toBe('Some callout text');
      expect(allText).not.toContain('💡');
    });
  });

  // ============================================================
  // Additional edge cases: insertText with active selection
  // ============================================================
  describe('insertText edge cases', () => {
    it('should replace selected text when inserting with a non-collapsed selection', () => {
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 11 },
        isCollapsed: false,
      };

      const result = insertText(doc, sel, '!');
      expect((result.doc[0].content[0] as any).text).toBe('Hello!');
      expect(result.selectionShift?.start.offset).toBe(6);
    });
  });

  // ============================================================
  // toggleMark edge cases
  // ============================================================
  describe('toggleMark edge cases', () => {
    it('should apply bold only to the selected range, not the entire inline node', () => {
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 6 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 11 },
        isCollapsed: false,
      };

      const result = toggleMark(doc, sel, 'bold');
      expect(result.doc[0].content.length).toBe(2);
      expect((result.doc[0].content[0] as any).text).toBe('Hello ');
      expect((result.doc[0].content[0] as any).marks).toBeUndefined();
      expect((result.doc[0].content[1] as any).text).toBe('World');
      expect((result.doc[0].content[1] as any).marks).toEqual([{ type: 'bold' }]);
    });

    it('should remove bold from selected range when all selected text is bold', () => {
      const doc: ASTDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'Bold Text', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' End' },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 1, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 1, offset: 9 },
        isCollapsed: false,
      };

      const result = toggleMark(doc, sel, 'bold');
      const allText = result.doc[0].content.map((n: any) => n.text).join('');
      expect(allText).toBe('Hello Bold Text End');
      const boldNodes = result.doc[0].content.filter((n: any) => n.marks?.some((m: any) => m.type === 'bold'));
      expect(boldNodes.length).toBe(0);
    });
  });

  // ============================================================
  // Edge case: deleteBackward removes empty block
  // ============================================================
  describe('deleteBackward edge cases', () => {
    it('should remove an empty block when backspacing into a non-empty previous block', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('Hello');
      expect(result.selectionShift?.start.blockIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(5);
    });

    it('should not crash when backspacing at the very start of the document', () => {
      const doc: ASTDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect((result.doc[0].content[0] as any).text).toBe('Hello');
    });

    it('should handle non-collapsed selection spanning multiple blocks', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Third' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        end: { blockIndex: 2, inlineIndex: 0, offset: 3 },
        isCollapsed: false,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      const allText = result.doc[0].content.map((n: any) => n.text).join('');
      expect(allText).toBe('Firrd');
    });
  });

  describe('EditorEngineService & Integration', () => {
    let engine: EditorEngineService;
    let selection: EditorSelectionService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [EditorEngineService, EditorSelectionService],
      });
      engine = TestBed.inject(EditorEngineService);
      selection = TestBed.inject(EditorSelectionService);
      engine.register(new ParagraphBehavior());
      engine.register(new CodeBlockBehavior());
    });

    afterEach(() => {
      TestBed.resetTestingModule();
    });

    it('should manage undo/redo history correctly', () => {
      selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      });

      engine.insertText('A');
      engine.insertText('B');

      expect((engine.document()[0].content[0] as any).text).toBe('AB');

      engine.undo();
      expect((engine.document()[0].content[0] as any).text).toBe('A');

      engine.undo();
      expect((engine.document()[0].content[0] as any).text).toBe('');

      engine.redo();
      expect((engine.document()[0].content[0] as any).text).toBe('A');
    });

    it('should let code block handle Tab interception natively', () => {
      engine.document.set([{ type: 'code-block', content: [{ type: 'text', text: 'let x;' }] }]);
      selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        isCollapsed: true,
      });

      const behavior = engine.blocks.get('code-block')!;
      const preventDefaultSpy = vi.fn();
      const event = { key: 'Tab', shiftKey: false, preventDefault: preventDefaultSpy } as any;

      const handled = behavior.onKeyDown!(event, {
        engine,
        selection: selection.active()!,
        blockEl: document.createElement('div'),
      });

      expect(handled).toBe(true);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect((engine.document()[0].content[0] as any).text).toBe('let   x;');
      expect(selection.active()?.start.offset).toBe(5);
    });

    it('should prioritize locked selection when a modal opens', () => {
      selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      });
      selection.lock(document.createElement('div'));
      selection.live.set({
        start: { blockIndex: 99, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 99, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      });

      expect(selection.active()?.start.blockIndex).toBe(0);
      expect(selection.isLocked()).toBe(true);

      selection.unlock();
      expect(selection.isLocked()).toBe(false);
    });
  });

  // ============================================================
  // List conversion: multi-block → list-item wrapping
  // ============================================================
  describe('wrapInList / unwrapFromList', () => {
    it('should wrap multiple paragraphs into a bullet-list with list-items', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Third' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 2, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      };

      const result = wrapInList(doc, sel, 'bullet-list');

      // Should produce 1 top-level block: the list container
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('bullet-list');

      // Container should have 3 list-item children
      expect(result.doc[0].content.length).toBe(3);
      expect(result.doc[0].content[0].type).toBe('list-item');
      expect(result.doc[0].content[1].type).toBe('list-item');
      expect(result.doc[0].content[2].type).toBe('list-item');

      // Each list-item should carry the original inline content
      expect(((result.doc[0].content[0] as any).content[0] as any).text).toBe('First');
      expect(((result.doc[0].content[1] as any).content[0] as any).text).toBe('Second');
      expect(((result.doc[0].content[2] as any).content[0] as any).text).toBe('Third');
    });

    it('should wrap a single paragraph into a list with one item', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Only item' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 9 },
        isCollapsed: true,
      };

      const result = wrapInList(doc, sel, 'ordered-list');
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('ordered-list');
      expect(result.doc[0].content.length).toBe(1);
      expect(result.doc[0].content[0].type).toBe('list-item');
      expect(((result.doc[0].content[0] as any).content[0] as any).text).toBe('Only item');
    });

    it('should wrap mixed block types (heading + paragraph) into list-items', () => {
      const doc: ASTDocument = [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body text' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 9 },
        isCollapsed: false,
      };

      const result = wrapInList(doc, sel, 'bullet-list');
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('bullet-list');
      expect(result.doc[0].content.length).toBe(2);
      expect(((result.doc[0].content[0] as any).content[0] as any).text).toBe('Title');
      expect(((result.doc[0].content[1] as any).content[0] as any).text).toBe('Body text');
    });

    it('should preserve blocks outside the selection when wrapping partial range', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Item A' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Item B' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 2, inlineIndex: 0, offset: 6 },
        isCollapsed: false,
      };

      const result = wrapInList(doc, sel, 'bullet-list');
      // Before paragraph + bullet-list + After paragraph = 3 top-level blocks
      expect(result.doc.length).toBe(3);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.doc[1].type).toBe('bullet-list');
      expect(result.doc[1].content.length).toBe(2);
      expect(result.doc[2].type).toBe('paragraph');
    });

    it('should unwrap list-items back to paragraphs', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'First' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'Second' }] },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = unwrapFromList(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.doc[1].type).toBe('paragraph');
      expect((result.doc[0].content[0] as any).text).toBe('First');
      expect((result.doc[1].content[0] as any).text).toBe('Second');
    });

    it('should toggle: wrap then unwrap when called on already-listed blocks', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Alpha' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Beta' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 4 },
        isCollapsed: false,
      };

      // First: wrap
      const wrapped = wrapInList(doc, sel, 'bullet-list');
      expect(wrapped.doc.length).toBe(1);
      expect(wrapped.doc[0].type).toBe('bullet-list');

      // Then: unwrap when the selection is on the list block
      const selOnList: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };
      const unwrapped = unwrapFromList(wrapped.doc, selOnList);
      expect(unwrapped.doc.length).toBe(2);
      expect(unwrapped.doc[0].type).toBe('paragraph');
      expect(unwrapped.doc[1].type).toBe('paragraph');
    });
  });

  // ============================================================
  // Paste / insertFragment fixes
  // ============================================================
  describe('insertFragment (paste)', () => {
    it('should not leave a ghost empty paragraph when pasting at offset 0 of a non-empty block', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'existing text' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };
      const fragment: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'pasted A' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'pasted B' }] },
      ];

      const result = insertFragment(doc, sel, fragment);

      // No block should be empty
      const emptyBlocks = result.doc.filter(
        (b) => b.content.length === 0 || (b.content.length === 1 && (b.content[0] as any).text === '')
      );
      expect(emptyBlocks.length).toBe(0);

      // Should have: pasted A, pasted B, existing text = 3 blocks
      expect(result.doc.length).toBe(3);
    });

    it('should merge fragment into the middle of existing text correctly', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'HelloWorld' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: true,
      };
      const fragment: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'pasted' }] },
      ];

      const result = insertFragment(doc, sel, fragment);

      // Single-block paste into middle: should merge inline content
      // Result: "HellopastedWorld" in one or more blocks, no empties
      const allText = result.doc.map((b) => b.content.map((n: any) => n.text).join('')).join('|');
      expect(allText).toContain('Hello');
      expect(allText).toContain('pasted');
      expect(allText).toContain('World');

      const emptyBlocks = result.doc.filter(
        (b) => b.content.length === 0 || (b.content.length === 1 && (b.content[0] as any).text === '')
      );
      expect(emptyBlocks.length).toBe(0);
    });

    it('should replace selected text with pasted fragment', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 11 },
        isCollapsed: false,
      };
      const fragment: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Pasted' }] },
      ];

      const result = insertFragment(doc, sel, fragment);
      const allText = result.doc.map((b) => b.content.map((n: any) => n.text).join('')).join('|');
      expect(allText).toContain('Hello');
      expect(allText).toContain('Pasted');
      expect(allText).not.toContain('World');
    });

    it('should not create ghost paragraphs from clipboard meta/html wrapper elements', () => {
      // Browser clipboard HTML contains <meta> and comment nodes
      const clipboardHtml = '<meta charset="utf-8"><p style="text-align: start">Line one</p><p style="text-align: start">Line two</p>';
      const blocks = new Map();
      const inlines = new Map();
      blocks.set('paragraph', new ParagraphBehavior());
      inlines.set('bold', new BoldBehavior());

      const ast = htmlToAst(clipboardHtml, blocks, inlines);

      // Should only have 2 paragraphs, not 3 (no ghost from <meta>)
      expect(ast.length).toBe(2);
      expect((ast[0].content[0] as any).text).toBe('Line one');
      expect((ast[1].content[0] as any).text).toBe('Line two');
    });
  });

  // ============================================================
  // Escape hatch: insert paragraph above first block
  // ============================================================
  describe('insertBlockAbove (escape hatch)', () => {
    it('should insert an empty paragraph above a code-block at index 0', () => {
      const doc: ASTDocument = [
        { type: 'code-block', content: [{ type: 'text', text: 'const x = 1;' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = insertBlockAbove(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.doc[0].content.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('');
      expect(result.doc[1].type).toBe('code-block');

      // Caret should be in the new paragraph
      expect(result.selectionShift?.start.blockIndex).toBe(0);
    });

    it('should insert a paragraph above a void block (hr) at index 0', () => {
      const doc: ASTDocument = [
        { type: 'hr', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'after' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = insertBlockAbove(doc, sel);
      expect(result.doc.length).toBe(3);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.doc[1].type).toBe('hr');
    });

    it('should work at any block index, not just 0', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'above' }] },
        { type: 'code-block', content: [{ type: 'text', text: 'code' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = insertBlockAbove(doc, sel);
      expect(result.doc.length).toBe(3);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.doc[1].type).toBe('paragraph');
      expect(result.doc[2].type).toBe('code-block');
      expect(result.selectionShift?.start.blockIndex).toBe(1);
    });

    it('should NOT insert if block 0 is already an empty paragraph', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = insertBlockAbove(doc, sel);
      // No-op: should not add another empty paragraph
      expect(result.doc.length).toBe(1);
    });
  });

  // ============================================================
  // Backspace at offset 0: block type downgrade before merge
  // ============================================================
  describe('deleteBackward at block start (type downgrade)', () => {
    it('should convert a heading at block 0 to a paragraph instead of no-op', () => {
      const doc: ASTDocument = [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'My Title' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
      expect((result.doc[0].content[0] as any).text).toBe('My Title');
      expect(result.doc[0].attrs).toBeUndefined();
    });

    it('should convert a code-block at block 0 to a paragraph', () => {
      const doc: ASTDocument = [
        { type: 'code-block', content: [{ type: 'text', text: 'const x = 1;' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
      expect((result.doc[0].content[0] as any).text).toBe('const x = 1;');
    });

    it('should convert a heading at block N to paragraph (not merge)', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'above' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Sub Title' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      // Should NOT merge into previous — just downgrade to paragraph
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.doc[1].type).toBe('paragraph');
      expect((result.doc[1].content[0] as any).text).toBe('Sub Title');
    });

    it('should still merge two paragraphs normally at block N', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('HelloWorld');
    });

    it('should remove an empty paragraph at block 0 if there is a next block', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'content' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect((result.doc[0].content[0] as any).text).toBe('content');
    });
  });

  // ============================================================
  // Backspace with void blocks (hr, image)
  // ============================================================
  describe('deleteBackward with void blocks', () => {
    it('should delete an hr at block N and move caret to end of previous block', () => {
      const doc: ASTDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'above' }] },
        { type: 'hr', content: [] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
      expect(result.selectionShift?.start.blockIndex).toBe(0);
    });

    it('should delete an hr at block 0 when there are blocks below', () => {
      const doc: ASTDocument = [
        { type: 'hr', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'below' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
      expect((result.doc[0].content[0] as any).text).toBe('below');
    });

    it('should convert an hr to empty paragraph when it is the only block', () => {
      const doc: ASTDocument = [
        { type: 'hr', content: [] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
    });

    it('should delete a preceding void block when backspacing at start of a paragraph', () => {
      const doc: ASTDocument = [
        { type: 'hr', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'text after hr' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = deleteBackward(doc, sel);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
      expect((result.doc[0].content[0] as any).text).toBe('text after hr');
    });
  });

  // ============================================================
  // Code block exit via double-Enter
  // ============================================================
  describe('exitCodeBlock', () => {
    it('should strip trailing newline from code block and insert a paragraph below', () => {
      const doc: ASTDocument = [
        { type: 'code-block', content: [{ type: 'text', text: 'const x = 1;\n' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 14 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 14 },
        isCollapsed: true,
      };

      const result = exitCodeBlock(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('code-block');
      expect((result.doc[0].content[0] as any).text).toBe('const x = 1;');
      expect(result.doc[1].type).toBe('paragraph');
      expect(result.selectionShift?.start.blockIndex).toBe(1);
    });

    it('should strip multiple trailing newlines and insert paragraph', () => {
      const doc: ASTDocument = [
        { type: 'code-block', content: [{ type: 'text', text: 'line1\nline2\n\n' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 13 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 13 },
        isCollapsed: true,
      };

      const result = exitCodeBlock(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('code-block');
      // Should strip both trailing newlines
      expect((result.doc[0].content[0] as any).text).toBe('line1\nline2');
      expect(result.doc[1].type).toBe('paragraph');
    });

    it('should produce a single empty paragraph if code block only had newlines', () => {
      const doc: ASTDocument = [
        { type: 'code-block', content: [{ type: 'text', text: '\n' }] },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 1 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 1 },
        isCollapsed: true,
      };

      const result = exitCodeBlock(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('code-block');
      expect(result.doc[1].type).toBe('paragraph');
    });
  });

  // ============================================================
  // List exit via double-Enter
  // ============================================================
  describe('exitList', () => {
    it('should remove the trailing empty list item and insert a paragraph below', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Item one' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'Item two' }] },
            { type: 'list-item', content: [{ type: 'text', text: '' }] },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = exitList(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('bullet-list');
      expect((result.doc[0].content as any[]).length).toBe(2);
      expect(result.doc[1].type).toBe('paragraph');
      expect(result.selectionShift?.start.blockIndex).toBe(1);
    });

    it('should unwrap entirely if the list only has one empty item', () => {
      const doc: ASTDocument = [
        {
          type: 'ordered-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: '' }] },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = exitList(doc, sel);
      // Should replace with a single empty paragraph
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
    });

    it('should work with ordered lists too', () => {
      const doc: ASTDocument = [
        {
          type: 'ordered-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Step 1' }] },
            { type: 'list-item', content: [{ type: 'text', text: '' }] },
          ],
        },
      ];
      const sel: LogicalSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      };

      const result = exitList(doc, sel);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('ordered-list');
      expect((result.doc[0].content as any[]).length).toBe(1);
      expect(result.doc[1].type).toBe('paragraph');
    });
  });

  // ============================================================
  // Split list item (Enter inside a list)
  // ============================================================
  describe('splitListItem', () => {
    it('should split a list item at the cursor position', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'HelloWorld' }] },
          ],
        },
      ];

      // Split at offset 5 in item 0
      const result = splitListItem(doc, 0, 0, 0, 5);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(2);
      expect(items[0].content[0].text).toBe('Hello');
      expect(items[1].content[0].text).toBe('World');
    });

    it('should create an empty item when splitting at end', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Hello' }] },
          ],
        },
      ];

      // Split at the end of item 0
      const result = splitListItem(doc, 0, 0, 0, 5);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(2);
      expect(items[0].content[0].text).toBe('Hello');
      expect(items[1].content[0].text).toBe('');
    });

    it('should move all content to new item when splitting at start', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Hello' }] },
          ],
        },
      ];

      // Split at offset 0 in item 0
      const result = splitListItem(doc, 0, 0, 0, 0);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(2);
      expect(items[0].content[0].text).toBe('');
      expect(items[1].content[0].text).toBe('Hello');
    });

    it('should split a specific item in a multi-item list', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'First' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'SecondThird' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'Last' }] },
          ],
        },
      ];

      // Split item 1 at offset 6
      const result = splitListItem(doc, 0, 1, 0, 6);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(4);
      expect(items[0].content[0].text).toBe('First');
      expect(items[1].content[0].text).toBe('Second');
      expect(items[2].content[0].text).toBe('Third');
      expect(items[3].content[0].text).toBe('Last');
    });

    it('should preserve marks when splitting', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            {
              type: 'list-item',
              content: [
                { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
                { type: 'text', text: 'Normal' },
              ],
            },
          ],
        },
      ];

      // Split at offset 4 in inline 0 (end of "Bold")
      const result = splitListItem(doc, 0, 0, 0, 4);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(2);
      expect(items[0].content[0].text).toBe('Bold');
      expect(items[0].content[0].marks[0].type).toBe('bold');
      expect(items[1].content[0].text).toBe('Normal');
    });

    it('should place cursor at start of new item (single item split)', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'HelloWorld' }] },
          ],
        },
      ];

      const result = splitListItem(doc, 0, 0, 0, 5);
      // After split: items = ["Hello", "World"]
      // Flat offset to start of "World" = length of "Hello" = 5
      expect(result.selectionShift?.start.blockIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(5);
    });

    it('should place cursor at correct flat offset in multi-item list', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'First' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'SecondThird' }] },
          ],
        },
      ];

      // Split item 1 at offset 6 → "Second" | "Third"
      const result = splitListItem(doc, 0, 1, 0, 6);
      // Items after split: ["First"(5), "Second"(6), "Third"(5)]
      // Flat offset to "Third" = 5 + 6 = 11
      expect(result.selectionShift?.start.blockIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(11);
    });

    it('should place cursor at flat offset after empty item split', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Item' }] },
          ],
        },
      ];

      // Split at end → creates empty item
      const result = splitListItem(doc, 0, 0, 0, 4);
      // Items after split: ["Item"(4), ""(0)]
      // Flat offset to "" = 4
      expect(result.selectionShift?.start.blockIndex).toBe(0);
      expect(result.selectionShift?.start.offset).toBe(4);
    });
  });

  // ============================================================
  // resolveContainerPosition — flat offset → item/inline/offset
  // ============================================================
  describe('resolveContainerPosition', () => {
    it('should resolve offset 0 to first item start', () => {
      const block: ASTBlockNode = {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Hello' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'World' }] },
        ],
      };
      const pos = resolveContainerPosition(block, 0);
      expect(pos.itemIndex).toBe(0);
      expect(pos.inlineIndex).toBe(0);
      expect(pos.offset).toBe(0);
    });

    it('should resolve mid-text offset to correct item', () => {
      const block: ASTBlockNode = {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Hello' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'World' }] },
        ],
      };
      // Flat offset 3 → "Hel|lo" in item 0
      const pos = resolveContainerPosition(block, 3);
      expect(pos.itemIndex).toBe(0);
      expect(pos.inlineIndex).toBe(0);
      expect(pos.offset).toBe(3);
    });

    it('should resolve offset at item boundary to next item', () => {
      const block: ASTBlockNode = {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Hello' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'World' }] },
        ],
      };
      // Flat offset 5 → boundary after "Hello", should be item 1 offset 0
      const pos = resolveContainerPosition(block, 5);
      expect(pos.itemIndex).toBe(1);
      expect(pos.inlineIndex).toBe(0);
      expect(pos.offset).toBe(0);
    });

    it('should resolve to correct inline node with marks', () => {
      const block: ASTBlockNode = {
        type: 'bullet-list',
        content: [
          {
            type: 'list-item',
            content: [
              { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
              { type: 'text', text: 'Normal' },
            ],
          },
        ],
      };
      // Flat offset 6 → "BoldNo|rmal" → inline 1, offset 2
      const pos = resolveContainerPosition(block, 6);
      expect(pos.itemIndex).toBe(0);
      expect(pos.inlineIndex).toBe(1);
      expect(pos.offset).toBe(2);
    });
  });

  // ============================================================
  // listEnter — unified Enter handler for lists
  // ============================================================
  describe('listEnter', () => {
    it('should split a non-empty item at the cursor', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'HelloWorld' }] },
          ],
        },
      ];

      const result = listEnter(doc, 0, 0, 0, 5);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(2);
      expect(items[0].content[0].text).toBe('Hello');
      expect(items[1].content[0].text).toBe('World');
    });

    it('should exit list when last item is empty', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Item' }] },
            { type: 'list-item', content: [{ type: 'text', text: '' }] },
          ],
        },
      ];

      // Enter on the last empty item → exit
      const result = listEnter(doc, 0, 1, 0, 0);
      expect(result.doc.length).toBe(2);
      expect(result.doc[0].type).toBe('bullet-list');
      expect((result.doc[0].content as any[]).length).toBe(1);
      expect(result.doc[1].type).toBe('paragraph');
    });

    it('should replace entire list with paragraph when only item is empty', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: '' }] },
          ],
        },
      ];

      const result = listEnter(doc, 0, 0, 0, 0);
      expect(result.doc.length).toBe(1);
      expect(result.doc[0].type).toBe('paragraph');
    });

    it('should split non-last empty item (not exit)', () => {
      const doc: ASTDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: '' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'After' }] },
          ],
        },
      ];

      // Enter on empty item 0 (NOT the last) → just split, don't exit
      const result = listEnter(doc, 0, 0, 0, 0);
      const items = result.doc[0].content as any[];
      expect(items.length).toBe(3);
      expect(result.doc[0].type).toBe('bullet-list');
    });
  });
});
