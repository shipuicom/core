import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import {
  BoldBehavior,
  BulletListBehavior,
  CodeBlockBehavior,
  HeadingBehavior,
  HrBehavior,
  ImageBehavior,
  InfoCalloutBehavior,
  InlineCodeBehavior,
  ItalicBehavior,
  LinkBehavior,
  ListItemBehavior,
  OrderedListBehavior,
  ParagraphBehavior,
  QuoteBehavior,
  StrikeBehavior,
  UnderlineBehavior,
} from './standard-behaviors';

/**
 * Integration tests for the EditorEngine.
 *
 * These tests drive actions through the engine's public API and verify
 * the resulting HTML output — the same output that goes to the DOM.
 */
describe('EditorEngine Integration (HTML output)', () => {
  let engine: EditorEngineService;

  /** Set selection on the engine. */
  function select(sel: Partial<LogicalSelection> & { start: LogicalSelection['start'] }) {
    engine.selection.live.set({
      start: sel.start,
      end: sel.end ?? sel.start,
      isCollapsed: sel.isCollapsed ?? true,
    } as LogicalSelection);
  }

  /** Shorthand for collapsed caret at a position. */
  function caret(blockIndex: number, inlineIndex: number, offset: number) {
    select({
      start: { blockIndex, inlineIndex, offset },
      isCollapsed: true,
    });
  }

  /** Get current HTML output. */
  function html(): string {
    return engine.serialize('html');
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [EditorEngineService, EditorSelectionService],
    });
    engine = TestBed.inject(EditorEngineService);

    // Register all behaviors
    [
      new ParagraphBehavior(),
      new HeadingBehavior(),
      new QuoteBehavior(),
      new InfoCalloutBehavior(),
      new CodeBlockBehavior(),
      new HrBehavior(),
      new ImageBehavior(),
      new BulletListBehavior(),
      new OrderedListBehavior(),
      new ListItemBehavior(),
    ].forEach((b) => engine.register(b));

    [
      new BoldBehavior(),
      new ItalicBehavior(),
      new UnderlineBehavior(),
      new StrikeBehavior(),
      new InlineCodeBehavior(),
      new LinkBehavior(),
    ].forEach((b) => engine.register(b));
  });

  // ============================================================
  // Text Insertion
  // ============================================================
  describe('insertText', () => {
    it('should produce a paragraph with the typed text', () => {
      caret(0, 0, 0);
      engine.insertText('Hello World');
      expect(html()).toBe('<p>Hello World</p>');
    });

    it('should insert text at the caret position', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      caret(0, 0, 5);
      engine.insertText(' World');
      expect(html()).toBe('<p>Hello World</p>');
    });
  });

  // ============================================================
  // Block Type Changes
  // ============================================================
  describe('setBlockType', () => {
    it('should convert paragraph to heading', () => {
      caret(0, 0, 0);
      engine.insertText('Title');
      caret(0, 0, 0);
      engine.setBlockType('heading', { level: 1 });
      expect(html()).toBe('<h1>Title</h1>');
    });

    it('should toggle heading back to paragraph', () => {
      caret(0, 0, 0);
      engine.insertText('Title');
      caret(0, 0, 0);
      engine.setBlockType('heading', { level: 1 });
      engine.setBlockType('heading', { level: 1 });
      expect(html()).toBe('<p>Title</p>');
    });

    it('should convert to blockquote', () => {
      caret(0, 0, 0);
      engine.insertText('Wise words');
      caret(0, 0, 0);
      engine.setBlockType('quote');
      expect(html()).toBe('<blockquote>Wise words</blockquote>');
    });

    it('should convert to info callout', () => {
      caret(0, 0, 0);
      engine.insertText('Note this');
      caret(0, 0, 0);
      engine.setBlockType('info-callout');
      expect(html()).toBe('<blockquote class="sh-editor-callout sh-editor-callout-info">Note this</blockquote>');
    });

    it('should convert to code block', () => {
      caret(0, 0, 0);
      engine.insertText('const x = 1;');
      caret(0, 0, 0);
      engine.setBlockType('code-block');
      expect(html()).toBe('<pre><code>const x = 1;</code></pre>');
    });
  });

  // ============================================================
  // Inline Marks
  // ============================================================
  describe('toggleMark', () => {
    it('should wrap selection in bold', () => {
      caret(0, 0, 0);
      engine.insertText('Hello World');
      select({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      });
      engine.toggleMark('bold');
      expect(html()).toBe('<p><strong>Hello</strong> World</p>');
    });

    it('should wrap selection in italic', () => {
      caret(0, 0, 0);
      engine.insertText('Hello World');
      select({
        start: { blockIndex: 0, inlineIndex: 0, offset: 6 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 11 },
        isCollapsed: false,
      });
      engine.toggleMark('italic');
      expect(html()).toBe('<p>Hello <em>World</em></p>');
    });

    it('should toggle bold off when applied twice', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      select({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      });
      engine.toggleMark('bold');
      // Re-select the now-bold text (it's now in inlineIndex 0 after split)
      select({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      });
      engine.toggleMark('bold');
      expect(html()).toBe('<p>Hello</p>');
    });

    it('should nest bold + italic marks', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      select({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      });
      engine.toggleMark('bold');
      select({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      });
      engine.toggleMark('italic');
      expect(html()).toBe('<p><em><strong>Hello</strong></em></p>');
    });
  });

  // ============================================================
  // Split Block (Enter)
  // ============================================================
  describe('splitBlock', () => {
    it('should split a paragraph into two', () => {
      caret(0, 0, 0);
      engine.insertText('HelloWorld');
      caret(0, 0, 5);
      engine.splitBlock();
      expect(html()).toBe('<p>Hello</p><p>World</p>');
    });

    it('should create an empty paragraph when splitting at the end', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      caret(0, 0, 5);
      engine.splitBlock();
      expect(html()).toBe('<p>Hello</p><p><br></p>');
    });
  });

  // ============================================================
  // Delete Backward (Backspace)
  // ============================================================
  describe('deleteBackward', () => {
    it('should delete a character', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      caret(0, 0, 5);
      engine.deleteBackward();
      expect(html()).toBe('<p>Hell</p>');
    });

    it('should merge two paragraphs on backspace at start', () => {
      caret(0, 0, 0);
      engine.insertText('HelloWorld');
      caret(0, 0, 5);
      engine.splitBlock();
      // Now: <p>Hello</p><p>World</p>
      caret(1, 0, 0);
      engine.deleteBackward();
      expect(html()).toBe('<p>HelloWorld</p>');
    });

    it('should convert heading to paragraph on backspace at block 0', () => {
      caret(0, 0, 0);
      engine.insertText('Title');
      caret(0, 0, 0);
      engine.setBlockType('heading', { level: 1 });
      // Now: <h1>Title</h1>
      caret(0, 0, 0);
      engine.deleteBackward();
      expect(html()).toBe('<p>Title</p>');
    });
  });

  // ============================================================
  // Void Blocks
  // ============================================================
  describe('void blocks', () => {
    it('should insert a horizontal rule', () => {
      caret(0, 0, 0);
      engine.insertText('Above');
      caret(0, 0, 5);
      engine.splitBlock();
      caret(1, 0, 0);
      engine.insertVoidBlock('hr');
      const output = html();
      expect(output).toContain('<hr>');
      expect(output).toContain('<p>Above</p>');
    });

    it('should delete an hr on backspace', () => {
      caret(0, 0, 0);
      engine.insertText('Above');
      caret(0, 0, 5);
      engine.splitBlock();
      caret(1, 0, 0);
      engine.insertVoidBlock('hr');
      // Find the hr block and backspace on it
      const doc = engine.document();
      const hrIdx = doc.findIndex((b) => b.type === 'hr');
      if (hrIdx >= 0) {
        caret(hrIdx, 0, 0);
        engine.deleteBackward();
      }
      expect(html()).not.toContain('<hr>');
    });
  });

  // ============================================================
  // Lists
  // ============================================================
  describe('lists', () => {
    it('should wrap a paragraph in a bullet list', () => {
      caret(0, 0, 0);
      engine.insertText('Item one');
      caret(0, 0, 0);
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<ul><li>Item one</li></ul>');
    });

    it('should wrap a paragraph in an ordered list', () => {
      caret(0, 0, 0);
      engine.insertText('Step one');
      caret(0, 0, 0);
      engine.setBlockType('ordered-list');
      expect(html()).toBe('<ol><li>Step one</li></ol>');
    });

    it('should toggle list off (unwrap)', () => {
      caret(0, 0, 0);
      engine.insertText('Item');
      caret(0, 0, 0);
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<ul><li>Item</li></ul>');

      caret(0, 0, 0);
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<p>Item</p>');
    });

    it('should exit list via exitList', () => {
      caret(0, 0, 0);
      engine.insertText('Item');
      caret(0, 0, 0);
      engine.setBlockType('bullet-list');

      // Manually add an empty list item to simulate Enter
      const doc = engine.document();
      const listBlock = structuredClone(doc[0]);
      (listBlock.content as any[]).push({ type: 'list-item', content: [{ type: 'text', text: '' }] });
      engine.reset([listBlock]);

      caret(0, 0, 0);
      engine.exitList();
      const output = html();
      expect(output).toContain('<ul><li>Item</li></ul>');
      expect(output).toContain('<p><br></p>');
    });

    it('should split a list item via splitListItem', () => {
      caret(0, 0, 0);
      engine.insertText('HelloWorld');
      caret(0, 0, 0);
      engine.setBlockType('bullet-list');
      // Now: <ul><li>HelloWorld</li></ul>

      engine.splitListItem(0, 0, 0, 5);
      expect(html()).toBe('<ul><li>Hello</li><li>World</li></ul>');
    });

    it('should split at end of item to create empty item below', () => {
      caret(0, 0, 0);
      engine.insertText('Item one');
      caret(0, 0, 0);
      engine.setBlockType('bullet-list');

      engine.splitListItem(0, 0, 0, 8);
      expect(html()).toBe('<ul><li>Item one</li><li><br></li></ul>');
    });

    it('should handle full lifecycle: split then exit', () => {
      caret(0, 0, 0);
      engine.insertText('Item one');
      caret(0, 0, 0);
      engine.setBlockType('bullet-list');

      // Split at end → creates empty item
      engine.splitListItem(0, 0, 0, 8);
      expect(html()).toBe('<ul><li>Item one</li><li><br></li></ul>');

      // Exit list → removes empty item, creates paragraph below
      caret(0, 0, 0);
      engine.exitList();
      const output = html();
      expect(output).toContain('<ul><li>Item one</li></ul>');
      expect(output).toContain('<p><br></p>');
    });
  });

  // ============================================================
  // Escape Hatch (insertBlockAbove)
  // ============================================================
  describe('insertBlockAbove', () => {
    it('should insert an empty paragraph above a code block', () => {
      caret(0, 0, 0);
      engine.insertText('code');
      caret(0, 0, 0);
      engine.setBlockType('code-block');
      // Now: <pre><code>code</code></pre>
      caret(0, 0, 0);
      engine.insertBlockAbove();
      const output = html();
      expect(output).toBe('<p><br></p><pre><code>code</code></pre>');
    });
  });

  // ============================================================
  // Code Block Exit
  // ============================================================
  describe('exitCodeBlock', () => {
    it('should exit code block and create paragraph below', () => {
      caret(0, 0, 0);
      engine.insertText('const x = 1;');
      caret(0, 0, 0);
      engine.setBlockType('code-block');
      // Simulate: user presses Enter once → newline added
      caret(0, 0, 12);
      engine.insertText('\n');
      // Now text is "const x = 1;\n", caret at offset 13
      caret(0, 0, 13);
      engine.exitCodeBlock();

      const output = html();
      expect(output).toContain('<pre><code>const x = 1;</code></pre>');
      expect(output).toContain('<p><br></p>');
    });
  });

  // ============================================================
  // Paste (insertFragment)
  // ============================================================
  describe('insertFragment', () => {
    it('should paste two paragraphs into an empty document', () => {
      caret(0, 0, 0);
      engine.insertFragment([
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
      ]);
      const output = html();
      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).not.toMatch(/<p><br><\/p><p>/); // No ghost empty paragraph at start
    });

    it('should merge single-block paste inline', () => {
      caret(0, 0, 0);
      engine.insertText('HelloWorld');
      caret(0, 0, 5);
      engine.insertFragment([
        { type: 'paragraph', content: [{ type: 'text', text: ' Beautiful ' }] },
      ]);
      expect(html()).toBe('<p>Hello Beautiful World</p>');
    });
  });

  // ============================================================
  // Undo / Redo
  // ============================================================
  describe('undo / redo', () => {
    it('should undo and redo text insertion', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      expect(html()).toBe('<p>Hello</p>');

      engine.undo();
      expect(html()).toBe('<p><br></p>');

      engine.redo();
      expect(html()).toBe('<p>Hello</p>');
    });
  });

  // ============================================================
  // Serialization
  // ============================================================
  describe('serialize', () => {
    it('should serialize to markdown', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      caret(0, 0, 0);
      engine.setBlockType('heading', { level: 1 });
      const md = engine.serialize('markdown');
      expect(md).toContain('# Hello');
    });

    it('should serialize to JSON', () => {
      caret(0, 0, 0);
      engine.insertText('Hello');
      const json = engine.serialize('json');
      expect(json).toEqual([
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
      ]);
    });
  });
});
