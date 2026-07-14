// @vitest-environment jsdom
import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { ASTBlockNode, ASTDocument, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as B from './standard-behaviors';

/**
 * Engine integration tests against the CURRENT public API (the predecessor of
 * this file targeted a since-removed transform API and never compiled). Each
 * scenario drives the engine like the component does — set a logical
 * selection, call an engine method — and asserts the serialized HTML and/or
 * document structure.
 */

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const textOf = (doc: ASTDocument, i: number, item?: number) => {
  const block = doc[i];
  const content = (item !== undefined ? (block.content as ASTBlockNode[])[item].content : block.content) as any[];
  return content.map((n) => n.text).join('');
};

describe('EditorEngine integration', () => {
  let engine: EditorEngineService;

  const caret = (blockIndex: number, offset: number, extra: { itemIndex?: number; inlineIndex?: number } = {}) => {
    const pos = { blockIndex, inlineIndex: extra.inlineIndex ?? 0, offset, ...(extra.itemIndex !== undefined ? { itemIndex: extra.itemIndex } : {}) };
    engine.selection.live.set({ start: pos, end: pos, isCollapsed: true } as LogicalSelection);
  };
  const range = (from: [number, number], to: [number, number]) => {
    engine.selection.live.set({
      start: { blockIndex: from[0], inlineIndex: 0, offset: from[1] },
      end: { blockIndex: to[0], inlineIndex: 0, offset: to[1] },
      isCollapsed: false,
    } as LogicalSelection);
  };
  const html = () => engine.serialize('html');

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
    });
    engine = runInInjectionContext(injector, () => new EditorEngineService());
    [
      new B.ParagraphBehavior(),
      new B.HeadingBehavior(),
      new B.QuoteBehavior(),
      new B.InfoCalloutBehavior(),
      new B.CodeBlockBehavior(),
      new B.HrBehavior(),
      new B.ImageBehavior(),
      new B.BulletListBehavior(),
      new B.OrderedListBehavior(),
      new B.ListItemBehavior(),
      new B.BoldBehavior(),
      new B.ItalicBehavior(),
      new B.UnderlineBehavior(),
      new B.StrikeBehavior(),
      new B.InlineCodeBehavior(),
      new B.LinkBehavior(),
    ].forEach((b) => engine.register(b));
  });

  describe('insertText', () => {
    it('types at the caret position', () => {
      engine.document.set([p('helo')]);
      caret(0, 3);
      engine.insertText('l');
      expect(html()).toBe('<p>hello</p>');
    });

    it('replaces a non-collapsed selection', () => {
      engine.document.set([p('hello world')]);
      range([0, 5], [0, 11]);
      engine.insertText('!');
      expect(html()).toBe('<p>hello!</p>');
    });
  });

  describe('setBlockType', () => {
    it('converts paragraph to heading with attrs', () => {
      engine.document.set([p('Title')]);
      caret(0, 0);
      engine.setBlockType('heading', { level: 2 });
      expect(html()).toBe('<h2>Title</h2>');
    });

    it('toggles the same type back to paragraph', () => {
      engine.document.set([p('Title')]);
      caret(0, 0);
      engine.setBlockType('heading', { level: 2 });
      caret(0, 0);
      engine.setBlockType('heading', { level: 2 });
      expect(html()).toBe('<p>Title</p>');
    });

    it('converts to quote and info-callout', () => {
      engine.document.set([p('quoted')]);
      caret(0, 0);
      engine.setBlockType('quote');
      expect(html()).toBe('<blockquote>quoted</blockquote>');
      caret(0, 0);
      engine.setBlockType('info-callout');
      expect(html()).toContain('sh-editor-callout-info');
    });

    it('flattens a multi-block selection into one code block', () => {
      engine.document.set([p('line1'), p('line2')]);
      range([0, 0], [1, 5]);
      engine.setBlockType('code-block');
      expect(engine.document()).toHaveLength(1);
      expect(textOf(engine.document(), 0)).toBe('line1\nline2');
      expect(html()).toBe('<pre><code>line1\nline2</code></pre>');
    });

    it('explodes a code block back into one paragraph per line', () => {
      engine.document.set([{ type: 'code-block', content: [{ type: 'text', text: 'a\nb' }] }] as ASTDocument);
      caret(0, 0);
      engine.setBlockType('code-block'); // toggle off
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
      expect(html()).toBe('<p>a</p><p>b</p>');
    });

    it('void stash round-trip: text -> hr -> text recovers the content', () => {
      engine.document.set([p('précieux')]);
      caret(0, 0);
      engine.setBlockType('hr');
      expect(engine.document()[0].type).toBe('hr');
      caret(0, 0);
      engine.setBlockType('paragraph');
      expect(textOf(engine.document(), 0)).toBe('précieux');
    });
  });

  describe('lists', () => {
    it('wraps a paragraph into a bullet list', () => {
      engine.document.set([p('item')]);
      caret(0, 0);
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<ul><li>item</li></ul>');
    });

    it('wraps a multi-block selection into ONE list with an item per block', () => {
      engine.document.set([p('one'), p('two')]);
      range([0, 0], [1, 3]);
      engine.setBlockType('ordered-list');
      expect(engine.document()).toHaveLength(1);
      expect(html()).toBe('<ol><li>one</li><li>two</li></ol>');
    });

    it('toggles a list back to paragraphs', () => {
      engine.document.set([p('one'), p('two')]);
      range([0, 0], [1, 3]);
      engine.setBlockType('bullet-list');
      caret(0, 0, { itemIndex: 0 });
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<p>one</p><p>two</p>');
    });

    it('Enter splits a list item', () => {
      engine.document.set([p('onetwo')]);
      caret(0, 0);
      engine.setBlockType('bullet-list');
      caret(0, 3, { itemIndex: 0 });
      engine.handleEnter();
      expect(html()).toBe('<ul><li>one</li><li>two</li></ul>');
    });

    it('Enter on an empty trailing item exits the list', () => {
      engine.document.set([
        { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'one' }] }, { type: 'list-item', content: [{ type: 'text', text: '' }] }] },
      ] as ASTDocument);
      caret(0, 0, { itemIndex: 1 });
      engine.handleEnter();
      expect(html()).toBe('<ul><li>one</li></ul><p><br></p>');
      expect(engine.selection.active()?.start.blockIndex).toBe(1); // caret in the escape paragraph
    });

    it('Backspace at the start of an item outdents it to a paragraph', () => {
      engine.document.set([
        { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'one' }] }, { type: 'list-item', content: [{ type: 'text', text: 'two' }] }] },
      ] as ASTDocument);
      caret(0, 0, { itemIndex: 0 });
      engine.handleBackspace();
      expect(html()).toBe('<p>one</p><ul><li>two</li></ul>');
    });
  });

  describe('Enter physics', () => {
    it('splits a paragraph mid-text', () => {
      engine.document.set([p('hello world')]);
      caret(0, 5);
      engine.handleEnter();
      expect(html()).toBe('<p>hello</p><p> world</p>');
      expect(engine.selection.active()?.start.blockIndex).toBe(1);
    });

    it('creates an empty paragraph when splitting at the end', () => {
      engine.document.set([p('done')]);
      caret(0, 4);
      engine.handleEnter();
      expect(html()).toBe('<p>done</p><p><br></p>');
    });

    it('heading breaks out to a paragraph at its end', () => {
      engine.document.set([{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] }] as ASTDocument);
      caret(0, 5);
      engine.handleEnter();
      expect(engine.document().map((b) => b.type)).toEqual(['heading', 'paragraph']);
    });

    it('code block inserts a newline instead of splitting', () => {
      engine.document.set([{ type: 'code-block', content: [{ type: 'text', text: 'const x' }] }] as ASTDocument);
      caret(0, 7);
      engine.handleEnter();
      expect(engine.document()).toHaveLength(1);
      expect(textOf(engine.document(), 0)).toBe('const x\n');
    });

    it('double Enter at the end of a code block breaks out', () => {
      engine.document.set([{ type: 'code-block', content: [{ type: 'text', text: 'x\n' }] }] as ASTDocument);
      caret(0, 2);
      engine.handleEnter();
      expect(engine.document().map((b) => b.type)).toEqual(['code-block', 'paragraph']);
      expect(textOf(engine.document(), 0)).toBe('x'); // trailing \n consumed
    });

    it('Enter on a void block inserts a paragraph below', () => {
      engine.document.set([{ type: 'hr', content: [] }] as ASTDocument);
      caret(0, 0);
      engine.handleEnter();
      expect(engine.document().map((b) => b.type)).toEqual(['hr', 'paragraph']);
    });
  });

  describe('Backspace physics', () => {
    it('deletes a character mid-text', () => {
      engine.document.set([p('abc')]);
      caret(0, 2);
      engine.handleBackspace();
      expect(html()).toBe('<p>ac</p>');
    });

    it('merges two paragraphs at block start', () => {
      engine.document.set([p('hello'), p('world')]);
      caret(1, 0);
      engine.handleBackspace();
      expect(html()).toBe('<p>helloworld</p>');
      // caret lands at the seam
      expect(engine.selection.active()?.start.offset).toBe(5);
    });

    it('downgrades a heading to paragraph at block 0 start (fallbackType)', () => {
      engine.document.set([{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] }] as ASTDocument);
      caret(0, 0);
      engine.handleBackspace();
      expect(engine.document()[0].type).toBe('paragraph');
      expect(textOf(engine.document(), 0)).toBe('Title');
    });

    it('removes a void block when backspacing on it', () => {
      engine.document.set([p('a'), { type: 'hr', content: [] }, p('b')] as ASTDocument);
      caret(1, 0);
      engine.handleBackspace();
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
    });
  });

  describe('toggleMark', () => {
    it('wraps and unwraps a range in bold', () => {
      engine.document.set([p('make bold')]);
      range([0, 5], [0, 9]);
      engine.toggleMark('bold');
      expect(html()).toBe('<p>make <strong>bold</strong></p>');
      range([0, 5], [0, 9]);
      engine.toggleMark('bold');
      expect(html()).toBe('<p>make bold</p>');
    });

    it('nests overlapping bold and italic as one continuous run', () => {
      engine.document.set([p('abcd')]);
      range([0, 0], [0, 4]);
      engine.toggleMark('bold');
      range([0, 1], [0, 3]);
      engine.toggleMark('italic');
      expect(html()).toBe('<p><strong>a<em>bc</em>d</strong></p>');
    });
  });

  describe('stored marks (collapsed-caret toggling)', () => {
    it('Cmd+B then typing produces bold text', () => {
      engine.document.set([p('plain ')]);
      caret(0, 6);
      engine.toggleMark('bold');
      expect(engine.isActive('bold')).toBe(true); // toolbar lights up before typing
      engine.insertText('bold');
      expect(html()).toBe('<p>plain <strong>bold</strong></p>');
    });

    it('continued typing stays bold via stickiness after the first char', () => {
      engine.document.set([p('x')]);
      caret(0, 1);
      engine.toggleMark('bold');
      engine.insertText('a');
      engine.insertText('b'); // no pending anymore — inherited from the bold node
      expect(html()).toBe('<p>x<strong>ab</strong></p>');
    });

    it('toggles OFF inside marked text: next char is unmarked, splitting the run', () => {
      engine.document.set([{ type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] }] as ASTDocument);
      caret(0, 2);
      engine.toggleMark('bold');
      expect(engine.isActive('bold')).toBe(false);
      engine.insertText('X');
      expect(html()).toBe('<p><strong>bo</strong>X<strong>ld</strong></p>');
    });

    it('does not apply when the caret has moved elsewhere', () => {
      engine.document.set([p('one'), p('two')]);
      caret(0, 3);
      engine.toggleMark('bold'); // pending at end of block 0
      caret(1, 3);
      engine.insertText('!'); // typed somewhere else
      expect(html()).toBe('<p>one</p><p>two!</p>');
    });

    it('double-toggle cancels the pending mark', () => {
      engine.document.set([p('x')]);
      caret(0, 1);
      engine.toggleMark('italic');
      engine.toggleMark('italic');
      engine.insertText('y');
      expect(html()).toBe('<p>xy</p>');
    });

    it('stacks multiple pending marks', () => {
      engine.document.set([p('')]);
      caret(0, 0);
      engine.toggleMark('bold');
      engine.toggleMark('italic');
      engine.insertText('hi');
      expect(html()).toBe('<p><strong><em>hi</em></strong></p>');
    });

    it('the stored-mark insertion is a single undoable transaction', () => {
      engine.document.set([p('a')]);
      caret(0, 1);
      engine.toggleMark('bold');
      engine.insertText('b');
      engine.undo();
      expect(html()).toBe('<p>a</p>');
      engine.redo();
      expect(html()).toBe('<p>a<strong>b</strong></p>');
    });
  });

  describe('escape hatch (ArrowUp/Left at doc start)', () => {
    it('injects an empty paragraph above a non-paragraph first block', () => {
      engine.document.set([{ type: 'code-block', content: [{ type: 'text', text: 'code' }] }] as ASTDocument);
      caret(0, 0);
      expect(engine.handleEscapeHatch()).toBe(true);
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'code-block']);
      expect(engine.selection.active()?.start.blockIndex).toBe(0);
    });

    it('does nothing when the first block is an empty paragraph', () => {
      engine.document.set([p('')]);
      caret(0, 0);
      expect(engine.handleEscapeHatch()).toBe(false);
    });

    it('moves the caret to the end of the previous block from a later block start', () => {
      engine.document.set([p('prev'), p('here')]);
      caret(1, 0);
      expect(engine.handleEscapeHatch()).toBe(true);
      const sel = engine.selection.active()!;
      expect(sel.start.blockIndex).toBe(0);
      expect(sel.start.offset).toBe(4);
    });
  });

  describe('insertFragment (paste)', () => {
    it('pastes multiple blocks into an empty document', () => {
      engine.document.set([p('')]);
      caret(0, 0);
      engine.insertFragment([p('one'), p('two')]);
      expect(html()).toBe('<p>one</p><p>two</p>');
    });

    it('merges a single-block fragment inline at the caret', () => {
      engine.document.set([p('ab')]);
      caret(0, 1);
      engine.insertFragment([p('XY')]);
      expect(html()).toBe('<p>aXYb</p>');
    });
  });

  describe('dispatch', () => {
    it('routes block types, marks, and history', () => {
      engine.document.set([p('text')]);
      range([0, 0], [0, 4]);
      engine.dispatch('bold');
      expect(html()).toBe('<p><strong>text</strong></p>');
      caret(0, 0);
      engine.dispatch('heading', { level: 3 });
      expect(html()).toContain('<h3');
      engine.dispatch('undo');
      expect(html()).toBe('<p><strong>text</strong></p>');
      engine.dispatch('redo');
      expect(html()).toContain('<h3');
    });
  });

  describe('deleteForward', () => {
    it('deletes the character after the caret', () => {
      engine.document.set([p('abc')]);
      caret(0, 1);
      engine.deleteForward();
      expect(html()).toBe('<p>ac</p>');
    });
  });

  describe('serialize', () => {
    it('serializes to markdown', () => {
      engine.document.set([
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Head' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'plain ' }, { type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      ] as ASTDocument);
      expect(engine.serialize('markdown')).toBe('## Head\n\nplain **bold**');
    });

    it('serializes to JSON as a detached deep clone', () => {
      engine.document.set([p('x')]);
      const json = engine.serialize('json');
      expect(json).toEqual(engine.document());
      json[0].content[0].text = 'mutated';
      expect(textOf(engine.document(), 0)).toBe('x'); // live doc untouched
    });
  });
});
