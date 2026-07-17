// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { toggleMark } from './editor-ast.utils';
import { astToHtml, astToMarkdown, htmlToAst } from './editor-serializers';
import { BaseInlineBehavior } from './editor-behaviors';
import {
  BoldBehavior,
  BulletListBehavior,
  HeadingBehavior,
  ItalicBehavior,
  ListItemBehavior,
  ParagraphBehavior,
} from './standard-behaviors';
import { ASTDocument, ASTMark, LogicalSelection } from './editor.types';

/**
 * Regression tests for two inline-mark defects fixed in the experimental editor:
 *
 *  1. Overlapping marks (e.g. a highlight spanning a bold word) must serialize
 *     as one continuous, correctly-nested run — not a fresh tag per inline node.
 *  2. Toggling a mark across a multi-block selection must apply it to every
 *     block in the span, with a single consistent add/remove decision.
 */

// A custom inline mark ("highlight") — a native <mark> with a class, used to
// exercise overlap where the gap between marks is visible (unlike bold).
class HighlightBehavior extends BaseInlineBehavior {
  readonly type = 'highlight';
  override isSticky = true;
  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'mark' ? { type: this.type } : null;
  }
  renderHTML(_mark: ASTMark, text: string) {
    return `<mark class="sh-editor-highlight">${text}</mark>`;
  }
  override renderMarkdown(_mark: ASTMark, text: string) {
    return `==${text}==`;
  }
}

const blocks = new Map<string, any>([
  ['paragraph', new ParagraphBehavior()],
  ['heading', new HeadingBehavior()],
  ['bullet-list', new BulletListBehavior()],
  ['list-item', new ListItemBehavior()],
]);
const inlines = new Map<string, any>([
  ['bold', new BoldBehavior()],
  ['italic', new ItalicBehavior()],
  ['highlight', new HighlightBehavior()],
]);

/** Which text carries `type` in each block, joined per block. */
const marked = (doc: ASTDocument, type: string) =>
  doc.map((b) =>
    (b.content as any[]).filter((n) => n.marks?.some((m: ASTMark) => m.type === type)).map((n) => n.text).join('')
  );

describe('inline mark serialization (overlapping marks)', () => {
  // AST equivalent of: highlight over "Welcome… config", bold over "config-driven".
  const doc: ASTDocument = [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Welcome to a ', marks: [{ type: 'highlight' }] },
        { type: 'text', text: 'config', marks: [{ type: 'highlight' }, { type: 'bold' }] },
        { type: 'text', text: '-driven', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' editor' },
      ],
    },
  ];

  it('renders one continuous <mark> spanning the bold boundary', () => {
    expect(astToHtml(doc, blocks, inlines)).toBe(
      '<p><mark class="sh-editor-highlight">Welcome to a <strong>config</strong></mark><strong>-driven</strong> editor</p>'
    );
  });

  it('renders continuous == in markdown too', () => {
    expect(astToMarkdown(doc, blocks, inlines)).toBe('==Welcome to a **config**==**-driven** editor');
  });

  it('a single mark over the whole text renders once', () => {
    const d: ASTDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'hello world', marks: [{ type: 'bold' }] }] },
    ];
    expect(astToHtml(d, blocks, inlines)).toBe('<p><strong>hello world</strong></p>');
  });

  it('round-trips: parse(serialize(doc)) serializes identically', () => {
    const html = astToHtml(doc, blocks, inlines);
    const reparsed = htmlToAst(html, blocks, inlines);
    expect(astToHtml(reparsed, blocks, inlines)).toBe(html);
  });
});

describe('cross-block toggleMark', () => {
  const twoParas = (): ASTDocument => [
    { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'world' }] },
  ];
  // Select "llo" (block 0, offset 2..end) through "wor" (block 1, offset 0..3).
  const spanSel = (): LogicalSelection => ({
    start: { blockIndex: 0, inlineIndex: 0, offset: 2 },
    end: { blockIndex: 1, inlineIndex: 0, offset: 3 },
    isCollapsed: false,
  });

  it('applies the mark to the affected range in every block in the span', () => {
    const res = toggleMark(twoParas(), spanSel(), 'bold', undefined, blocks);
    expect(marked(res.doc, 'bold')).toEqual(['llo', 'wor']);
  });

  it('toggles OFF only when the whole span already has the mark', () => {
    const on = toggleMark(twoParas(), spanSel(), 'bold', undefined, blocks);
    const off = toggleMark(on.doc, spanSel(), 'bold', undefined, blocks);
    expect(marked(off.doc, 'bold')).toEqual(['', '']);
  });

  it('ADDS across the whole span when only part of it is already marked', () => {
    // Pre-bold just "llo" in block 0.
    const pre = toggleMark(
      twoParas(),
      { start: { blockIndex: 0, inlineIndex: 0, offset: 2 }, end: { blockIndex: 0, inlineIndex: 0, offset: 5 }, isCollapsed: false },
      'bold',
      undefined,
      blocks
    );
    const res = toggleMark(pre.doc, spanSel(), 'bold', undefined, blocks);
    expect(marked(res.doc, 'bold')).toEqual(['llo', 'wor']);
  });

  it('is mark-agnostic — works for the custom highlight mark', () => {
    const res = toggleMark(twoParas(), spanSel(), 'highlight', undefined, blocks);
    expect(marked(res.doc, 'highlight')).toEqual(['llo', 'wor']);
  });

  it('single-block selection is unaffected (regression guard)', () => {
    const res = toggleMark(
      twoParas(),
      { start: { blockIndex: 0, inlineIndex: 0, offset: 0 }, end: { blockIndex: 0, inlineIndex: 0, offset: 5 }, isCollapsed: false },
      'bold',
      undefined,
      blocks
    );
    expect(marked(res.doc, 'bold')).toEqual(['hello', '']);
  });
});
