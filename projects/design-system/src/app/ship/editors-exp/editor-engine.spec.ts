// @vitest-environment jsdom
import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorEngineService } from './editor-engine.service';
import { htmlToAst } from './editor-serializers';
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
      engine.document.set(listDoc());
      // "bef|ore"  →  into list item 1 (index 1) at "item| two"
      engine.selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        end: { blockIndex: 1, itemIndex: 1, inlineIndex: 0, offset: 4 },
        isCollapsed: false,
      } as LogicalSelection);
      engine.deleteRange();
      expect(html()).toBe('<p>bef two</p><ul><li>item three</li></ul><p>after</p>');
    });

    it('typing over the selection replaces it (the reported bug) without nuking the list', () => {
      engine.document.set(listDoc());
      engine.selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        end: { blockIndex: 1, itemIndex: 0, inlineIndex: 0, offset: 5 },
        isCollapsed: false,
      } as LogicalSelection);
      engine.insertText('X');
      expect(html()).toBe('<p>befXone</p><ul><li>item two</li><li>item three</li></ul><p>after</p>');
    });

    it('consuming the whole list (into the last item end) removes the now-empty list', () => {
      engine.document.set(listDoc());
      engine.selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 3 },
        end: { blockIndex: 1, itemIndex: 2, inlineIndex: 0, offset: 10 },
        isCollapsed: false,
      } as LogicalSelection);
      engine.deleteRange();
      expect(html()).toBe('<p>bef</p><p>after</p>');
    });

    it('drops intermediate blocks between the paragraph and the list', () => {
      engine.document.set([p('start'), p('middle'), listDoc()[1], p('end')] as ASTDocument);
      engine.selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 2 },
        end: { blockIndex: 2, itemIndex: 0, inlineIndex: 0, offset: 4 },
        isCollapsed: false,
      } as LogicalSelection);
      engine.deleteRange();
      expect(html()).toBe('<p>st one</p><ul><li>item two</li><li>item three</li></ul><p>end</p>');
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

    it('a fully-bold selection reports bold active (whole-selection intersection)', () => {
      engine.document.set([p('one bold two')]);
      range([0, 4], [0, 8]);
      engine.toggleMark('bold');
      range([0, 4], [0, 8]); // reselect exactly "bold"
      expect(engine.isActive('bold')).toBe(true);
      range([0, 4], [0, 12]); // "bold two" — partly plain
      expect(engine.isActive('bold')).toBe(false);
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

  describe('link marks (setMark / removeMark / uiRequest)', () => {
    it('setMark force-applies a link with attrs over a selection', () => {
      engine.document.set([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://a.example' });
      expect(html()).toBe('<p>visit <a href="https://a.example">here</a> now</p>');
    });

    it('setMark REPLACES an existing link href (editing is not a toggle)', () => {
      engine.document.set([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://old.example' });
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://new.example' });
      expect(html()).toContain('href="https://new.example"');
      expect(html()).not.toContain('old.example');
    });

    it('a collapsed caret inside a link expands to the whole run for edit and removal', () => {
      engine.document.set([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://a.example' });
      // caret in the middle of "here" (char 8 of the block)
      caret(0, 2, { inlineIndex: 1 });
      engine.setMark('link', { href: 'https://edited.example' });
      expect(html()).toBe('<p>visit <a href="https://edited.example">here</a> now</p>');

      caret(0, 2, { inlineIndex: 1 });
      engine.removeMark('link');
      expect(html()).toBe('<p>visit here now</p>');
    });

    it('setMark returns false for a collapsed caret outside any link', () => {
      engine.document.set([p('plain')]);
      caret(0, 2);
      expect(engine.setMark('link', { href: 'https://x.example' })).toBe(false);
      expect(html()).toBe('<p>plain</p>');
    });

    it('insertTextWithMarks inserts linked text as one undoable transaction', () => {
      engine.document.set([p('see ')]);
      caret(0, 4);
      engine.insertTextWithMarks('https://d.example', [{ type: 'link', attrs: { href: 'https://d.example' } }]);
      expect(html()).toBe('<p>see <a href="https://d.example">https://d.example</a></p>');
      engine.undo();
      expect(html()).toBe('<p>see </p>');
    });

    it("dispatch('link') without attrs emits a uiRequest instead of toggling", () => {
      engine.document.set([p('text')]);
      range([0, 0], [0, 4]);
      expect(engine.uiRequest()).toBeNull();
      engine.dispatch('link');
      expect(engine.uiRequest()?.action).toBe('link');
      expect(html()).toBe('<p>text</p>'); // nothing toggled
      const t1 = engine.uiRequest()!.token;
      engine.dispatch('link');
      expect(engine.uiRequest()!.token).not.toBe(t1); // re-dispatch re-triggers
    });

    it('markAtSelection finds the link from EITHER edge of the run (prefill for editing)', () => {
      engine.document.set([p('visit here now')]);
      range([0, 6], [0, 10]);
      engine.setMark('link', { href: 'https://edge.example' });

      // Start edge: caret resolves into the preceding plain node ("visit ").
      caret(0, 6);
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://edge.example');
      // End edge.
      caret(0, 0, { inlineIndex: 2 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://edge.example');
      // Inside.
      caret(0, 2, { inlineIndex: 1 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://edge.example');
      // Far away: nothing.
      caret(0, 2);
      expect(engine.markAtSelection('link')).toBeNull();
    });

    it('markAtSelection returns the caret-adjacent link, not another link in the block', () => {
      engine.document.set([p('aa bb cc')]);
      range([0, 0], [0, 2]);
      engine.setMark('link', { href: 'https://first.example' });
      range([0, 6], [0, 8]);
      engine.setMark('link', { href: 'https://second.example' });

      // Start edge of the SECOND link, spelled as end-of-previous-node — the
      // representation DOM mapping produces (content: [link1, " bb ", link2]).
      caret(0, 4, { inlineIndex: 1 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://second.example');
      // And inside the first link still resolves to the first.
      caret(0, 1, { inlineIndex: 0 });
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://first.example');
    });

    it('selecting a linked word makes the link active and prefills for editing', () => {
      engine.document.set([p('go here now')]);
      range([0, 3], [0, 7]);
      engine.setMark('link', { href: 'https://sel.example' });
      // Reselect exactly the linked word.
      range([0, 3], [0, 7]);
      expect(engine.isActive('link')).toBe(true);
      expect(engine.markAtSelection('link')?.attrs?.['href']).toBe('https://sel.example');
    });

    it('a selection only partly covering a link is NOT active', () => {
      engine.document.set([p('go here now')]);
      range([0, 3], [0, 7]);
      engine.setMark('link', { href: 'https://x.example' });
      range([0, 3], [0, 10]); // "here now" — spills past the link
      expect(engine.isActive('link')).toBe(false);
    });

    it('a selection spanning two different links is not one active link', () => {
      engine.document.set([p('aa bb cc')]);
      range([0, 0], [0, 2]);
      engine.setMark('link', { href: 'https://one.example' });
      range([0, 6], [0, 8]);
      engine.setMark('link', { href: 'https://two.example' });
      range([0, 0], [0, 8]); // covers both
      expect(engine.isActive('link')).toBe(false);
    });

    it("dispatch('bold') still toggles directly (no UI request)", () => {
      engine.document.set([p('text')]);
      range([0, 0], [0, 4]);
      engine.dispatch('bold');
      expect(engine.uiRequest()).toBeNull();
      expect(html()).toBe('<p><strong>text</strong></p>');
    });
  });

  describe('images (void block insert / select / edit / delete)', () => {
    it('inserts an image after the current block with a trailing paragraph, and selects it', () => {
      engine.document.set([p('above')]);
      caret(0, 5);
      engine.insertImage({ src: 'https://x.example/a.png', alt: 'a', mode: 'content', size: 'auto' });
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph', 'image', 'paragraph']);
      expect(engine.selectedBlock()).toBe(1);
      expect(html()).toContain('<img src="https://x.example/a.png"');
    });

    it('replaces an empty paragraph rather than pushing it down', () => {
      engine.document.set([p('')]);
      caret(0, 0);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      expect(engine.document().map((b) => b.type)).toEqual(['image', 'paragraph']);
      expect(engine.selectedBlock()).toBe(0);
    });

    it("dispatch('image') opens a uiRequest instead of converting the block", () => {
      engine.document.set([p('text')]);
      caret(0, 0);
      engine.dispatch('image');
      expect(engine.uiRequest()?.action).toBe('image');
      expect(engine.document().map((b) => b.type)).toEqual(['paragraph']); // unchanged
    });

    it('updateSelectedImage merges attrs as an undoable transaction', () => {
      engine.document.set([p('')]);
      caret(0, 0);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      engine.updateSelectedImage({ mode: 'custom', size: 'large' });
      expect(html()).toContain('class="sh-editor-img-custom sh-editor-img-size-large"');
      engine.undo();
      expect(html()).toContain('class="sh-editor-img-content"'); // reverts the attr change only
      expect(engine.document()[0].type).toBe('image'); // image still there
    });

    it('deleteSelectedBlock removes the image and clears the selection', () => {
      engine.document.set([p('above'), p('below')]);
      caret(0, 5);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      expect(engine.document()).toHaveLength(4); // above, image, trailing p, below
      engine.deleteSelectedBlock();
      expect(engine.document().some((b) => b.type === 'image')).toBe(false);
      expect(engine.selectedBlock()).toBeNull();
    });

    it('selectBlock ignores non-void blocks', () => {
      engine.document.set([p('text')]);
      engine.selectBlock(0);
      expect(engine.selectedBlock()).toBeNull();
    });

    it('renders a size class for float/custom modes but not for content/theater', () => {
      engine.document.set([p('')]);
      caret(0, 0);
      engine.insertImage({ src: 'https://x.example/a.png', alt: '', mode: 'content', size: 'auto' });
      // content is fixed-width: no size class (else the size buttons would have
      // nothing to act on, but content has no size buttons)
      expect(html()).toContain('class="sh-editor-img-content"');
      expect(html()).not.toContain('sh-editor-img-size');

      engine.updateSelectedImage({ mode: 'theater' });
      expect(html()).toContain('class="sh-editor-img-theater"');
      expect(html()).not.toContain('sh-editor-img-size');

      // float carries the size, so the toolbar's size buttons change the render
      engine.updateSelectedImage({ mode: 'float', size: 'medium' });
      expect(html()).toContain('class="sh-editor-img-float sh-editor-img-size-medium"');
      engine.updateSelectedImage({ size: 'small' });
      expect(html()).toContain('class="sh-editor-img-float sh-editor-img-size-small"');
    });
  });

  describe('slash commands', () => {
    it('aggregates the slash entries every block behavior declares', () => {
      const ids = engine.slashCommands().map((c) => c.id);
      // one entry per registered block behavior that opts in (order = registration)
      expect(ids).toEqual([
        'paragraph', 'heading-1', 'heading-2', 'quote', 'info-callout',
        'code-block', 'hr', 'image', 'bullet-list', 'ordered-list',
      ]);
    });

    it('detects a "/" trigger at the block start and reports the query', () => {
      engine.document.set([p('/head')]);
      caret(0, 5);
      expect(engine.slashState()).toEqual({ query: 'head', length: 5 });
    });

    it('triggers after whitespace but not mid-word or inside a URL', () => {
      engine.document.set([p('see /img')]);
      caret(0, 8);
      expect(engine.slashState()?.query).toBe('img'); // after a space

      engine.document.set([p('a/b')]);
      caret(0, 3);
      expect(engine.slashState()).toBeNull(); // "/" not at a word boundary

      engine.document.set([p('http://x')]);
      caret(0, 8);
      expect(engine.slashState()).toBeNull(); // scheme slash, preceded by ':'
    });

    it('is null when the caret is not at the end of the query or the block is not text', () => {
      engine.document.set([p('/head extra')]);
      caret(0, 5); // caret after "/head" but text continues → query run does not end here
      expect(engine.slashState()?.query).toBe('head');
      caret(0, 3); // mid-query
      expect(engine.slashState()?.query).toBe('he');
    });

    it('applySlashCommand strips the "/query" trigger, then runs the command', () => {
      engine.document.set([p('/head')]);
      caret(0, 5);
      const cmd = engine.slashCommands().find((c) => c.id === 'heading-2')!;
      engine.applySlashCommand(cmd);
      expect(engine.document()[0].type).toBe('heading');
      expect(engine.document()[0].attrs?.['level']).toBe(2);
      expect(textOf(engine.document(), 0)).toBe(''); // "/head" removed, not left behind
    });

    it('keeps text before the trigger when converting mid-line', () => {
      engine.document.set([p('note /quote')]);
      caret(0, 11);
      const cmd = engine.slashCommands().find((c) => c.id === 'quote')!;
      engine.applySlashCommand(cmd);
      expect(engine.document()[0].type).toBe('quote');
      expect(textOf(engine.document(), 0)).toBe('note '); // only "/quote" stripped
    });

    it('routes a requestsUi command (image) to a uiRequest after stripping', () => {
      engine.document.set([p('/img')]);
      caret(0, 4);
      const cmd = engine.slashCommands().find((c) => c.id === 'image')!;
      engine.applySlashCommand(cmd);
      expect(engine.uiRequest()?.action).toBe('image');
      expect(textOf(engine.document(), 0)).toBe(''); // trigger text gone
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

  describe('soft line breaks (Shift+Enter)', () => {
    it('a paragraph \\n renders as <br> (new line, not new paragraph)', () => {
      engine.document.set([{ type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] }] as ASTDocument);
      caret(0, 5);
      engine.insertText('\n'); // insertLineBreak path
      expect(engine.document()).toHaveLength(1); // still ONE block
      expect(html()).toBe('<p>hello\n world</p>'.replace('\n', '<br>'));
    });

    it('a soft break inside a bold run stays inside the mark', () => {
      engine.document.set([{ type: 'paragraph', content: [{ type: 'text', text: 'ab', marks: [{ type: 'bold' }] }] }] as ASTDocument);
      caret(0, 1);
      engine.insertText('\n');
      expect(html()).toBe('<p><strong>a<br>b</strong></p>');
    });

    it('a code block keeps \\n literal (no <br>)', () => {
      engine.document.set([{ type: 'code-block', content: [{ type: 'text', text: 'a\nb' }] }] as ASTDocument);
      expect(html()).toBe('<pre><code>a\nb</code></pre>');
    });

    it('<br> round-trips through parse and render', () => {
      const doc = htmlToAst('<p>line1<br>line2</p>', engine.blocks, engine.inlines);
      expect(doc[0].content).toEqual([{ type: 'text', text: 'line1\nline2' }]);
      engine.document.set(doc);
      expect(html()).toBe('<p>line1<br>line2</p>');
    });

    it('a trailing soft break gets a padding <br> that does not round-trip as content', () => {
      engine.document.set([{ type: 'paragraph', content: [{ type: 'text', text: 'a\n' }] }] as ASTDocument);
      expect(html()).toBe('<p>a<br><br data-sh-pad=""></p>');
      // The pad <br> is a caret shim, not content: re-parsing yields just "a\n".
      const doc = htmlToAst(html(), engine.blocks, engine.inlines);
      expect(doc[0].content).toEqual([{ type: 'text', text: 'a\n' }]);
    });

    it('an empty-block placeholder <br> parses to empty, not a newline', () => {
      const doc = htmlToAst('<p><br></p>', engine.blocks, engine.inlines);
      expect(doc[0].content).toEqual([{ type: 'text', text: '' }]);
      engine.document.set(doc);
      expect(html()).toBe('<p><br></p>'); // re-renders as the same placeholder
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
