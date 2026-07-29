// @vitest-environment jsdom

import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { logicalToPos, posToLogical } from './editor-flat-positions';
import { htmlToAst } from './editor-serializers';
import { ASTBlockNode, ASTDocument, LogicalPosition } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as B from './standard-behaviors';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const textOf = (doc: ASTDocument, i: number, item?: number) => {
  const block = doc[i];
  const content = (item !== undefined ? (block.content as ASTBlockNode[])[item].content : block.content) as any[];
  return content.map((n) => n.text).join('');
};

describe('EditorEngine integration', () => {
  let engine: EditorEngineService;

  // Selections are flat positions; these helpers convert the tree-shaped
  // coordinates the tests are written in.
  const flat = (pos: { blockIndex: number; itemIndex?: number; inlineIndex?: number; offset: number }) =>
    logicalToPos(engine.document(), { inlineIndex: 0, ...pos } as LogicalPosition);
  const caret = (blockIndex: number, offset: number, extra: { itemIndex?: number; inlineIndex?: number } = {}) => {
    const at = flat({ blockIndex, offset, ...extra });
    engine.selection.live.set({ from: at, to: at });
  };
  const range = (from: [number, number], to: [number, number]) => {
    engine.selection.live.set({
      from: flat({ blockIndex: from[0], offset: from[1] }),
      to: flat({ blockIndex: to[0], offset: to[1] }),
    });
  };
  /** Tree-shaped view of the live caret, for assertions written in tree coordinates. */
  const caretLp = () => posToLogical(engine.document(), engine.selection.active()!.from)!;
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
      new B.StyleBehavior(),
    ].forEach((b) => engine.register(b));
  });

  describe('insertText', () => {
    it('types at the caret position', () => {
      engine.load([p('helo')]);
      caret(0, 3);
      engine.insertText('l');
      expect(html()).toBe('<p>hello</p>');
    });

    it('replaces a non-collapsed selection', () => {
      engine.load([p('hello world')]);
      range([0, 5], [0, 11]);
      engine.insertText('!');
      expect(html()).toBe('<p>hello!</p>');
    });
  });

  describe('setBlockType', () => {
    it('converts paragraph to heading with attrs', () => {
      engine.load([p('Title')]);
      caret(0, 0);
      engine.setBlockType('heading', { level: 2 });
      expect(html()).toBe('<h2>Title</h2>');
    });

    it('toggles the same type back to paragraph', () => {
      engine.load([p('Title')]);
      caret(0, 0);
      engine.setBlockType('heading', { level: 2 });
      caret(0, 0);
      engine.setBlockType('heading', { level: 2 });
      expect(html()).toBe('<p>Title</p>');
    });

    it('converts to quote and info-callout', () => {
      engine.load([p('quoted')]);
      caret(0, 0);
      engine.setBlockType('quote');
      expect(html()).toBe('<blockquote>quoted</blockquote>');
      caret(0, 0);
      engine.setBlockType('info-callout');
      expect(html()).toContain('sh-editor-callout-info');
    });

    it('flattens a multi-block selection into one code block', () => {
      engine.load([p('line1'), p('line2')]);
      range([0, 0], [1, 5]);
      engine.setBlockType('code-block');
      expect(engine.document()).toHaveLength(1);
      expect(textOf(engine.document(), 0)).toBe('line1\nline2');
      expect(html()).toBe('<pre><code>line1\nline2</code></pre>');
    });

    it('explodes a code block back into one paragraph per line', () => {
      engine.load([{ type: 'code-block', content: [{ type: 'text', text: 'a\nb' }] }] as ASTDocument);
      caret(0, 0);
      engine.setBlockType('code-block');
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
      expect(html()).toBe('<p>a</p><p>b</p>');
    });

    it('void stash round-trip: text -> hr -> text recovers the content', () => {
      engine.load([p('précieux')]);
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
      engine.load([p('item')]);
      caret(0, 0);
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<ul><li>item</li></ul>');
    });

    it('wraps a multi-block selection into ONE list with an item per block', () => {
      engine.load([p('one'), p('two')]);
      range([0, 0], [1, 3]);
      engine.setBlockType('ordered-list');
      expect(engine.document()).toHaveLength(1);
      expect(html()).toBe('<ol><li>one</li><li>two</li></ol>');
    });

    it('toggles a list back to paragraphs', () => {
      engine.load([p('one'), p('two')]);
      range([0, 0], [1, 3]);
      engine.setBlockType('bullet-list');
      caret(0, 0, { itemIndex: 0 });
      engine.setBlockType('bullet-list');
      expect(html()).toBe('<p>one</p><p>two</p>');
    });

    it('Enter splits a list item', () => {
      engine.load([p('onetwo')]);
      caret(0, 0);
      engine.setBlockType('bullet-list');
      caret(0, 3, { itemIndex: 0 });
      engine.handleEnter();
      expect(html()).toBe('<ul><li>one</li><li>two</li></ul>');
    });

    it('Enter on an empty trailing item exits the list', () => {
      engine.load([
        { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'one' }] }, { type: 'list-item', content: [{ type: 'text', text: '' }] }] },
      ] as ASTDocument);
      caret(0, 0, { itemIndex: 1 });
      engine.handleEnter();
      expect(html()).toBe('<ul><li>one</li></ul><p><br></p>');
      expect(caretLp().blockIndex).toBe(1);
    });

    it('Backspace at the start of an item outdents it to a paragraph', () => {
      engine.load([
        { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'one' }] }, { type: 'list-item', content: [{ type: 'text', text: 'two' }] }] },
      ] as ASTDocument);
      caret(0, 0, { itemIndex: 0 });
      engine.handleBackspace();
      expect(html()).toBe('<p>one</p><ul><li>two</li></ul>');
    });
  });

  describe('cross-block range delete into a list (container tail)', () => {
    const listDoc = () =>
      [
        p('before'),
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'item one' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'item two' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'item three' }] },
          ],
        },
        p('after'),
      ] as ASTDocument;

    it('keeps the list items past the cursor; the end item tail joins the paragraph', () => {
      engine.load(listDoc());

      engine.selection.live.set({
        from: flat({ blockIndex: 0, offset: 3 }),
        to: flat({ blockIndex: 1, itemIndex: 1, offset: 4 }),
      });
      engine.deleteRange();
      expect(html()).toBe('<p>bef two</p><ul><li>item three</li></ul><p>after</p>');
    });

    it('typing over the selection replaces it (the reported bug) without nuking the list', () => {
      engine.load(listDoc());
      engine.selection.live.set({
        from: flat({ blockIndex: 0, offset: 3 }),
        to: flat({ blockIndex: 1, itemIndex: 0, offset: 5 }),
      });
      engine.insertText('X');
      expect(html()).toBe('<p>befXone</p><ul><li>item two</li><li>item three</li></ul><p>after</p>');
    });

    it('consuming the whole list (into the last item end) removes the now-empty list', () => {
      engine.load(listDoc());
      engine.selection.live.set({
        from: flat({ blockIndex: 0, offset: 3 }),
        to: flat({ blockIndex: 1, itemIndex: 2, offset: 10 }),
      });
      engine.deleteRange();
      expect(html()).toBe('<p>bef</p><p>after</p>');
    });

    it('drops intermediate blocks between the paragraph and the list', () => {
      engine.load([p('start'), p('middle'), listDoc()[1], p('end')] as ASTDocument);
      engine.selection.live.set({
        from: flat({ blockIndex: 0, offset: 2 }),
        to: flat({ blockIndex: 2, itemIndex: 0, offset: 4 }),
      });
      engine.deleteRange();
      expect(html()).toBe('<p>st one</p><ul><li>item two</li><li>item three</li></ul><p>end</p>');
    });
  });

  describe('Enter physics', () => {
    it('splits a paragraph mid-text', () => {
      engine.load([p('hello world')]);
      caret(0, 5);
      engine.handleEnter();
      expect(html()).toBe('<p>hello</p><p> world</p>');
      expect(caretLp().blockIndex).toBe(1);
    });

    it('creates an empty paragraph when splitting at the end', () => {
      engine.load([p('done')]);
      caret(0, 4);
      engine.handleEnter();
      expect(html()).toBe('<p>done</p><p><br></p>');
    });

    it('heading breaks out to a paragraph at its end', () => {
      engine.load([{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] }] as ASTDocument);
      caret(0, 5);
      engine.handleEnter();
      expect(engine.document().map((b) => b.type)).toEqual(['heading', 'paragraph']);
    });

    it('code block inserts a newline instead of splitting', () => {
      engine.load([{ type: 'code-block', content: [{ type: 'text', text: 'const x' }] }] as ASTDocument);
      caret(0, 7);
      engine.handleEnter();
      expect(engine.document()).toHaveLength(1);
      expect(textOf(engine.document(), 0)).toBe('const x\n');
    });

    it('double Enter at the end of a code block breaks out', () => {
      engine.load([{ type: 'code-block', content: [{ type: 'text', text: 'x\n' }] }] as ASTDocument);
      caret(0, 2);
      engine.handleEnter();
      expect(engine.document().map((b) => b.type)).toEqual(['code-block', 'paragraph']);
      expect(textOf(engine.document(), 0)).toBe('x');
    });

    it('Enter on a void block inserts a paragraph below', () => {
      engine.load([{ type: 'hr', content: [] }] as ASTDocument);
      caret(0, 0);
      engine.handleEnter();
      expect(engine.document().map((b) => b.type)).toEqual(['hr', 'paragraph']);
    });
  });

  describe('Backspace physics', () => {
    it('deletes a character mid-text', () => {
      engine.load([p('abc')]);
      caret(0, 2);
      engine.handleBackspace();
      expect(html()).toBe('<p>ac</p>');
    });

    it('merges two paragraphs at block start', () => {
      engine.load([p('hello'), p('world')]);
      caret(1, 0);
      engine.handleBackspace();
      expect(html()).toBe('<p>helloworld</p>');

      expect(caretLp().offset).toBe(5);
    });

    it('downgrades a heading to paragraph at block 0 start (fallbackType)', () => {
      engine.load([{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] }] as ASTDocument);
      caret(0, 0);
      engine.handleBackspace();
      expect(engine.document()[0].type).toBe('paragraph');
      expect(textOf(engine.document(), 0)).toBe('Title');
    });

    it('removes a void block when backspacing on it', () => {
      engine.load([p('a'), { type: 'hr', content: [] }, p('b')] as ASTDocument);
      caret(1, 0);
      engine.handleBackspace();
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
    });
  });

  describe('toggleMark', () => {
    it('wraps and unwraps a range in bold', () => {
      engine.load([p('make bold')]);
      range([0, 5], [0, 9]);
      engine.toggleMark('bold');
      expect(html()).toBe('<p>make <strong>bold</strong></p>');
      range([0, 5], [0, 9]);
      engine.toggleMark('bold');
      expect(html()).toBe('<p>make bold</p>');
    });

    it('a fully-bold selection reports bold active (whole-selection intersection)', () => {
      engine.load([p('one bold two')]);
      range([0, 4], [0, 8]);
      engine.toggleMark('bold');
      range([0, 4], [0, 8]);
      expect(engine.isActive('bold')).toBe(true);
      range([0, 4], [0, 12]);
      expect(engine.isActive('bold')).toBe(false);
    });

    it('nests overlapping bold and italic as one continuous run', () => {
      engine.load([p('abcd')]);
      range([0, 0], [0, 4]);
      engine.toggleMark('bold');
      range([0, 1], [0, 3]);
      engine.toggleMark('italic');
      expect(html()).toBe('<p><strong>a<em>bc</em>d</strong></p>');
    });
  });

  describe('stored marks (collapsed-caret toggling)', () => {
    it('Cmd+B then typing produces bold text', () => {
      engine.load([p('plain ')]);
      caret(0, 6);
      engine.toggleMark('bold');
      expect(engine.isActive('bold')).toBe(true);
      engine.insertText('bold');
      expect(html()).toBe('<p>plain <strong>bold</strong></p>');
    });

    it('continued typing stays bold via stickiness after the first char', () => {
      engine.load([p('x')]);
      caret(0, 1);
      engine.toggleMark('bold');
      engine.insertText('a');
      engine.insertText('b');
      expect(html()).toBe('<p>x<strong>ab</strong></p>');
    });

    it('toggles OFF inside marked text: next char is unmarked, splitting the run', () => {
      engine.load([{ type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] }] as ASTDocument);
      caret(0, 2);
      engine.toggleMark('bold');
      expect(engine.isActive('bold')).toBe(false);
      engine.insertText('X');
      expect(html()).toBe('<p><strong>bo</strong>X<strong>ld</strong></p>');
    });

    it('does not apply when the caret has moved elsewhere', () => {
      engine.load([p('one'), p('two')]);
      caret(0, 3);
      engine.toggleMark('bold');
      caret(1, 3);
      engine.insertText('!');
      expect(html()).toBe('<p>one</p><p>two!</p>');
    });

    it('double-toggle cancels the pending mark', () => {
      engine.load([p('x')]);
      caret(0, 1);
      engine.toggleMark('italic');
      engine.toggleMark('italic');
      engine.insertText('y');
      expect(html()).toBe('<p>xy</p>');
    });

    it('stacks multiple pending marks', () => {
      engine.load([p('')]);
      caret(0, 0);
      engine.toggleMark('bold');
      engine.toggleMark('italic');
      engine.insertText('hi');
      expect(html()).toBe('<p><strong><em>hi</em></strong></p>');
    });

    it('the stored-mark insertion is a single undoable transaction', () => {
      engine.load([p('a')]);
      caret(0, 1);
      engine.toggleMark('bold');
      engine.insertText('b');
      engine.undo();
      expect(html()).toBe('<p>a</p>');
      engine.redo();
      expect(html()).toBe('<p>a<strong>b</strong></p>');
    });
  });

  describe('link marks (setMark / removeMark / uiRequest)', () => {
    it('setMark force-applies a link with attrs over a selection', () => {
      engine.load([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://a.example' });
      expect(html()).toBe('<p>visit <a href="https://a.example">here</a> now</p>');
    });

    it('setMark REPLACES an existing link href (editing is not a toggle)', () => {
      engine.load([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://old.example' });
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://new.example' });
      expect(html()).toContain('href="https://new.example"');
      expect(html()).not.toContain('old.example');
    });

    it('a collapsed caret inside a link expands to the whole run for edit and removal', () => {
      engine.load([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://a.example' });

      caret(0, 2, { inlineIndex: 1 });
      engine.setMark('link', { href: 'https://edited.example' });
      expect(html()).toBe('<p>visit <a href="https://edited.example">here</a> now</p>');

      caret(0, 2, { inlineIndex: 1 });
      engine.removeMark('link');
      expect(html()).toBe('<p>visit here now</p>');
    });

    it('setMark returns false for a collapsed caret outside any link', () => {
      engine.load([p('plain')]);
      caret(0, 2);
      expect(engine.setMark('link', { href: 'https://x.example' })).toBe(false);
      expect(html()).toBe('<p>plain</p>');
    });

    it('insertTextWithMarks inserts linked text as one undoable transaction', () => {
      engine.load([p('see ')]);
      caret(0, 4);
      engine.insertTextWithMarks('https://d.example', [{ type: 'link', attrs: { href: 'https://d.example' } }]);
      expect(html()).toBe('<p>see <a href="https://d.example">https://d.example</a></p>');
      engine.undo();
      expect(html()).toBe('<p>see </p>');
    });

    it("dispatch('link') without attrs emits a uiRequest instead of toggling", () => {
      engine.load([p('text')]);
      range([0, 0], [0, 4]);
      expect(engine.uiRequest()).toBeNull();
      engine.dispatch('link');
      expect(engine.uiRequest()?.action).toBe('link');
      expect(html()).toBe('<p>text</p>');
      const t1 = engine.uiRequest()!.token;
      engine.dispatch('link');
      expect(engine.uiRequest()!.token).not.toBe(t1);
    });

    it('markAtSelection finds the link from EITHER edge of the run (prefill for editing)', () => {
      engine.load([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://edge.example' });

      caret(0, 6);
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://edge.example');

      caret(0, 0, { inlineIndex: 2 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://edge.example');

      caret(0, 2, { inlineIndex: 1 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://edge.example');

      caret(0, 2);
      expect(engine.markAtSelection('link')).toBeNull();
    });

    it('markAtSelection returns the caret-adjacent link, not another link in the block', () => {
      engine.load([p('aa bb cc')]);
      range([0, 0], [0, 2]);
      engine.setMark('link', { href: 'https://first.example' });
      range([0, 6], [0, 8]);
      engine.setMark('link', { href: 'https://second.example' });

      caret(0, 4, { inlineIndex: 1 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://second.example');

      caret(0, 1, { inlineIndex: 0 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://first.example');
    });

    it('selecting a linked word makes the link active and prefills for editing', () => {
      engine.load([p('go here now')]);
      range([0, 3], [0, 7]);
      engine.setMark('link', { href: 'https://sel.example' });

      range([0, 3], [0, 7]);
      expect(engine.isActive('link')).toBe(true);
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://sel.example');
    });

    it('a selection only partly covering a link is NOT active', () => {
      engine.load([p('go here now')]);
      range([0, 3], [0, 7]);
      engine.setMark('link', { href: 'https://x.example' });
      range([0, 3], [0, 10]);
      expect(engine.isActive('link')).toBe(false);
    });

    it('a selection spanning two different links is not one active link', () => {
      engine.load([p('aa bb cc')]);
      range([0, 0], [0, 2]);
      engine.setMark('link', { href: 'https://one.example' });
      range([0, 6], [0, 8]);
      engine.setMark('link', { href: 'https://two.example' });
      range([0, 0], [0, 8]);
      expect(engine.isActive('link')).toBe(false);
    });

    it("dispatch('bold') still toggles directly (no UI request)", () => {
      engine.load([p('text')]);
      range([0, 0], [0, 4]);
      engine.dispatch('bold');
      expect(engine.uiRequest()).toBeNull();
      expect(html()).toBe('<p><strong>text</strong></p>');
    });
  });

  describe('images (void block insert / select / edit / delete)', () => {
    it('inserts an image after the current block with a trailing paragraph, and selects it', () => {
      engine.load([p('above')]);
      caret(0, 5);
      engine.insertImage({ src: 'https://x.example/a.png', alt: 'a', mode: 'content', size: 'auto' });
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'image', 'paragraph']);
      expect(engine.selectedBlock()).toBe(1);
      expect(html()).toContain('<img src="https://x.example/a.png"');
    });

    it('replaces an empty paragraph rather than pushing it down', () => {
      engine.load([p('')]);
      caret(0, 0);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      expect(engine.document().map((b) => b.type)).toEqual(['image', 'paragraph']);
      expect(engine.selectedBlock()).toBe(0);
    });

    it("dispatch('image') opens a uiRequest instead of converting the block", () => {
      engine.load([p('text')]);
      caret(0, 0);
      engine.dispatch('image');
      expect(engine.uiRequest()?.action).toBe('image');
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph']);
    });

    it('updateSelectedImage merges attrs as an undoable transaction', () => {
      engine.load([p('')]);
      caret(0, 0);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      engine.updateSelectedImage({ mode: 'custom', size: 'large' });
      expect(html()).toContain('class="sh-editor-img-custom sh-editor-img-size-large"');
      engine.undo();
      expect(html()).toContain('class="sh-editor-img-content"');
      expect(engine.document()[0].type).toBe('image');
    });

    it('deleteSelectedBlock removes the image and clears the selection', () => {
      engine.load([p('above'), p('below')]);
      caret(0, 5);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      expect(engine.document()).toHaveLength(4);
      engine.deleteSelectedBlock();
      expect(engine.document().some((b) => b.type === 'image')).toBe(false);
      expect(engine.selectedBlock()).toBeNull();
    });

    it('selectBlock ignores non-void blocks', () => {
      engine.load([p('text')]);
      engine.selectBlock(0);
      expect(engine.selectedBlock()).toBeNull();
    });

    it('moveBlock reorders a block to a later gap (drag down)', () => {
      engine.load([p('A'), p('B'), p('C'), p('D')]);
      engine.moveBlock(1, 3);
      expect([0, 1, 2, 3].map((i) => textOf(engine.document(), i))).toEqual(['A', 'C', 'B', 'D']);
    });

    it('moveBlock reorders a block to an earlier gap (drag up)', () => {
      engine.load([p('A'), p('B'), p('C')]);
      engine.moveBlock(2, 0);
      expect([0, 1, 2].map((i) => textOf(engine.document(), i))).toEqual(['C', 'A', 'B']);
    });

    it('moveBlock is a no-op when dropped in its own gap, and is undoable', () => {
      const doc = [p('A'), p('B'), p('C')];
      engine.load(doc);
      engine.moveBlock(1, 1);
      engine.moveBlock(1, 2);
      expect([0, 1, 2].map((i) => textOf(engine.document(), i))).toEqual(['A', 'B', 'C']);

      engine.moveBlock(0, 3);
      expect([0, 1, 2].map((i) => textOf(engine.document(), i))).toEqual(['B', 'C', 'A']);
      engine.undo();
      expect([0, 1, 2].map((i) => textOf(engine.document(), i))).toEqual(['A', 'B', 'C']);
    });

    it('moveBlock keeps a selected image selected at its new index', () => {
      const img = { type: 'image', attrs: { src: 'https://x.example/a.png', mode: 'content', size: 'auto' }, content: [] };
      engine.load([p('above'), p('mid'), img] as ASTDocument);
      engine.selectBlock(2);
      engine.moveBlock(2, 0);
      expect(engine.document()[0].type).toBe('image');
      expect(engine.selectedBlock()).toBe(0);
    });

    it('renders a size class for float/custom modes but not for content/theater', () => {
      engine.load([p('')]);
      caret(0, 0);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });

      expect(html()).toContain('class="sh-editor-img-content"');
      expect(html()).not.toContain('sh-editor-img-size');

      engine.updateSelectedImage({ mode: 'theater' });
      expect(html()).toContain('class="sh-editor-img-theater"');
      expect(html()).not.toContain('sh-editor-img-size');

      engine.updateSelectedImage({ mode: 'float', size: 'medium' });
      expect(html()).toContain('class="sh-editor-img-float sh-editor-img-size-medium"');
      engine.updateSelectedImage({ size: 'small' });
      expect(html()).toContain('class="sh-editor-img-float sh-editor-img-size-small"');
    });
  });

  describe('slash commands', () => {
    it('aggregates the slash entries every block behavior declares', () => {
      const ids = engine.slashCommands().map((c) => c.id);

      expect(ids).toEqual([
        'paragraph', 'heading-1', 'heading-2', 'quote', 'info-callout',
        'code-block', 'hr', 'image', 'bullet-list', 'ordered-list',
      ]);
    });

    it('detects a "/" trigger at the block start and reports the query', () => {
      engine.load([p('/head')]);
      caret(0, 5);
      expect(engine.slashState()).toEqual({ query: 'head', length: 5 });
    });

    it('triggers after whitespace but not mid-word or inside a URL', () => {
      engine.load([p('see /img')]);
      caret(0, 8);
      expect(engine.slashState()?.query).toBe('img');

      engine.load([p('a/b')]);
      caret(0, 3);
      expect(engine.slashState()).toBeNull();

      engine.load([p('http://x')]);
      caret(0, 8);
      expect(engine.slashState()).toBeNull();
    });

    it('is null when the caret is not at the end of the query or the block is not text', () => {
      engine.load([p('/head extra')]);
      caret(0, 5);
      expect(engine.slashState()?.query).toBe('head');
      caret(0, 3);
      expect(engine.slashState()?.query).toBe('he');
    });

    it('applySlashCommand strips the "/query" trigger, then runs the command', () => {
      engine.load([p('/head')]);
      caret(0, 5);
      const cmd = engine.slashCommands().find((c) => c.id === 'heading-2')!;
      engine.applySlashCommand(cmd);
      expect(engine.document()[0].type).toBe('heading');
      expect(engine.document()[0].attrs?.['level']).toBe(2);
      expect(textOf(engine.document(), 0)).toBe('');
    });

    it('keeps text before the trigger when converting mid-line', () => {
      engine.load([p('note /quote')]);
      caret(0, 11);
      const cmd = engine.slashCommands().find((c) => c.id === 'quote')!;
      engine.applySlashCommand(cmd);
      expect(engine.document()[0].type).toBe('quote');
      expect(textOf(engine.document(), 0)).toBe('note ');
    });

    it('routes a requestsUi command (image) to a uiRequest after stripping', () => {
      engine.load([p('/img')]);
      caret(0, 4);
      const cmd = engine.slashCommands().find((c) => c.id === 'image')!;
      engine.applySlashCommand(cmd);
      expect(engine.uiRequest()?.action).toBe('image');
      expect(textOf(engine.document(), 0)).toBe('');
    });
  });

  describe('inline style mark (applyStyle / span[style])', () => {
    it('wraps the selection in a <span style> with the applied property', () => {
      engine.load([p('hello')]);
      range([0, 0], [0, 5]);
      engine.applyStyle({ color: '#ff0000' });
      expect(html()).toBe('<p><span style="color: #ff0000">hello</span></p>');
    });

    it('merges properties onto the existing style (Google-Docs stacking)', () => {
      engine.load([p('hello')]);
      range([0, 0], [0, 5]);
      engine.applyStyle({ color: '#ff0000' });
      range([0, 0], [0, 5]);
      engine.applyStyle({ 'font-size': '20px' });
      const out = html();
      expect(out).toContain('color: #ff0000');
      expect(out).toContain('font-size: 20px');
      expect((out.match(/<span/g) ?? []).length).toBe(1);
    });

    it('removes one property with a null value, and the mark when empty', () => {
      engine.load([p('hi')]);
      range([0, 0], [0, 2]);
      engine.applyStyle({ color: '#00ff00', 'font-size': '14px' });
      range([0, 0], [0, 2]);
      engine.applyStyle({ color: null });
      expect(html()).not.toContain('color');
      expect(html()).toContain('font-size: 14px');
      range([0, 0], [0, 2]);
      engine.applyStyle({ 'font-size': null });
      expect(html()).toBe('<p>hi</p>');
    });

    it('drops injection-shaped style values on render, keeping the safe ones', () => {
      engine.load([
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'style', attrs: { color: 'red; background:url(javascript:alert(1))', 'font-size': '14px' } }],
            },
          ],
        },
      ] as ASTDocument);
      const out = html();
      expect(out).not.toContain('javascript');
      expect(out).not.toContain('url(');
      expect(out).not.toMatch(/color/);
      expect(out).toContain('font-size: 14px');
    });
  });

  describe('escape hatch (ArrowUp/Left at doc start)', () => {
    it('injects an empty paragraph above a non-paragraph first block', () => {
      engine.load([{ type: 'code-block', content: [{ type: 'text', text: 'code' }] }] as ASTDocument);
      caret(0, 0);
      expect(engine.handleEscapeHatch()).toBe(true);
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'code-block']);
      expect(caretLp().blockIndex).toBe(0);
    });

    it('does nothing when the first block is an empty paragraph', () => {
      engine.load([p('')]);
      caret(0, 0);
      expect(engine.handleEscapeHatch()).toBe(false);
    });

    it('moves the caret to the end of the previous block from a later block start', () => {
      engine.load([p('prev'), p('here')]);
      caret(1, 0);
      expect(engine.handleEscapeHatch()).toBe(true);
      const lp = caretLp();
      expect(lp.blockIndex).toBe(0);
      expect(lp.offset).toBe(4);
    });
  });

  describe('void block copy/paste', () => {
    it('pasting over a selected void replaces it, caret after the fragment', () => {
      engine.load([p('a'), { type: 'hr', content: [] }, p('b')] as ASTDocument);
      engine.selectBlock(1);
      expect(engine.selectedBlock()).toBe(1);
      engine.replaceSelectedBlock([p('x'), p('y')]);
      expect(html()).toBe('<p>a</p><p>x</p><p>y</p><p>b</p>');
      expect(engine.selectedBlock()).toBeNull();
      const lp = caretLp();
      expect(lp.blockIndex).toBe(2);
      expect(lp.offset).toBe(1);
      engine.undo();
      expect(html()).toBe('<p>a</p><hr><p>b</p>');
    });

    it('pasting an identical void over itself deselects and moves the caret after it', () => {
      engine.load([p('a'), { type: 'hr', content: [] }, p('b')] as ASTDocument);
      engine.selectBlock(1);
      engine.replaceSelectedBlock([{ type: 'hr', content: [] }] as ASTDocument);
      expect(html()).toBe('<p>a</p><hr><p>b</p>');
      expect(engine.selectedBlock()).toBeNull();
      expect(engine.canUndo()).toBe(false);
      // A second paste now lands after the hr instead of replacing it.
      engine.insertFragment([{ type: 'hr', content: [] }] as ASTDocument);
      expect(html()).toBe('<p>a</p><hr><hr><p>b</p>');
    });
  });

  describe('insertFragment (paste)', () => {
    it('collapses the selection after the pasted content even when it equals the selection', () => {
      engine.load([p('hello')]);
      range([0, 0], [0, 5]);
      engine.insertFragment([p('hello')]);
      // Identity paste: no document change, no transaction — but the caret
      // must land after the pasted content, not stay selected.
      expect(engine.canUndo()).toBe(false);
      expect(engine.selection.active()).toEqual({ from: 6, to: 6 });
      engine.insertText('!');
      expect(html()).toBe('<p>hello!</p>');
    });

    it('puts the caret at the end of a pasted list', () => {
      engine.load([p('ab')]);
      caret(0, 1);
      engine.insertFragment([
        { type: 'bullet-list', content: [
          { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
        ] },
      ] as ASTDocument);
      const lp = caretLp();
      expect(lp.blockIndex).toBe(1);
      expect(lp.itemIndex).toBe(1);
      expect(lp.offset).toBe(3);
      engine.insertText('!');
      expect(html()).toBe('<p>a</p><ul><li>one</li><li>two!</li></ul><p>b</p>');
    });

    it('pastes multiple blocks into an empty document', () => {
      engine.load([p('')]);
      caret(0, 0);
      engine.insertFragment([p('one'), p('two')]);
      expect(html()).toBe('<p>one</p><p>two</p>');
    });

    it('merges a single-block fragment inline at the caret', () => {
      engine.load([p('ab')]);
      caret(0, 1);
      engine.insertFragment([p('XY')]);
      expect(html()).toBe('<p>aXYb</p>');
    });
  });

  describe('dispatch', () => {
    it('routes block types, marks, and history', () => {
      engine.load([p('text')]);
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
      engine.load([p('abc')]);
      caret(0, 1);
      engine.deleteForward();
      expect(html()).toBe('<p>ac</p>');
    });
  });

  describe('soft line breaks (Shift+Enter)', () => {
    it('a paragraph \\n renders as <br> (new line, not new paragraph)', () => {
      engine.load([{ type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] }] as ASTDocument);
      caret(0, 5);
      engine.insertText('\n');
      expect(engine.document()).toHaveLength(1);
      expect(html()).toBe('<p>hello\n world</p>'.replace('\n', '<br>'));
    });

    it('a soft break inside a bold run stays inside the mark', () => {
      engine.load([{ type: 'paragraph', content: [{ type: 'text', text: 'ab', marks: [{ type: 'bold' }] }] }] as ASTDocument);
      caret(0, 1);
      engine.insertText('\n');
      expect(html()).toBe('<p><strong>a<br>b</strong></p>');
    });

    it('a code block keeps \\n literal (no <br>)', () => {
      engine.load([{ type: 'code-block', content: [{ type: 'text', text: 'a\nb' }] }] as ASTDocument);
      expect(html()).toBe('<pre><code>a\nb</code></pre>');
    });

    it('<br> round-trips through parse and render', () => {
      const doc = htmlToAst('<p>line1<br>line2</p>', engine.blocks, engine.inlines);
      expect(doc[0].content).toEqual([{ type: 'text', text: 'line1\nline2' }]);
      engine.load(doc);
      expect(html()).toBe('<p>line1<br>line2</p>');
    });

    it('a trailing soft break gets a padding <br> that does not round-trip as content', () => {
      engine.load([{ type: 'paragraph', content: [{ type: 'text', text: 'a\n' }] }] as ASTDocument);
      expect(html()).toBe('<p>a<br><br data-sh-pad=""></p>');

      const doc = htmlToAst(html(), engine.blocks, engine.inlines);
      expect(doc[0].content).toEqual([{ type: 'text', text: 'a\n' }]);
    });

    it('an empty-block placeholder <br> parses to empty, not a newline', () => {
      const doc = htmlToAst('<p><br></p>', engine.blocks, engine.inlines);
      expect(doc[0].content).toEqual([{ type: 'text', text: '' }]);
      engine.load(doc);
      expect(html()).toBe('<p><br></p>');
    });
  });

  describe('serialize', () => {
    it('serializes to markdown', () => {
      engine.load([
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Head' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'plain ' }, { type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      ] as ASTDocument);
      expect(engine.serialize('markdown')).toBe('## Head\n\nplain **bold**');
    });

    it('serializes to JSON as a detached deep clone', () => {
      engine.load([p('x')]);
      const json = engine.serialize('json');
      expect(json).toEqual(engine.document());
      json[0].content[0].text = 'mutated';
      expect(textOf(engine.document(), 0)).toBe('x');
    });
  });
});