// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { fromColumnar, toColumnar } from './editor-columnar';
import { toggleMarkOp } from './editor-columnar-mutations';
import { logicalToPos } from './editor-flat-positions';
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
import { ASTDocument, ASTMark } from './editor.types';

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

const marked = (doc: ASTDocument, type: string) =>
  doc.map((b) =>
    (b.content as any[]).filter((n) => n.marks?.some((m: ASTMark) => m.type === type)).map((n) => n.text).join('')
  );

describe('inline mark serialization (overlapping marks)', () => {

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

  // The columnar toggle mutates in place and returns the op; the resulting
  // document is read back out of the columnar form.
  const toggle = (doc: ASTDocument, sel: { s: [number, number]; e: [number, number] }, markType: string): ASTDocument => {
    const cd = toColumnar(doc);
    const from = logicalToPos(doc, { blockIndex: sel.s[0], inlineIndex: 0, offset: sel.s[1] });
    const to = logicalToPos(doc, { blockIndex: sel.e[0], inlineIndex: 0, offset: sel.e[1] });
    toggleMarkOp(cd, { from, to }, markType, undefined, blocks);
    return fromColumnar(cd);
  };

  const span = { s: [0, 2] as [number, number], e: [1, 3] as [number, number] };

  it('applies the mark to the affected range in every block in the span', () => {
    expect(marked(toggle(twoParas(), span, 'bold'), 'bold')).toEqual(['llo', 'wor']);
  });

  it('toggles OFF only when the whole span already has the mark', () => {
    const on = toggle(twoParas(), span, 'bold');
    expect(marked(toggle(on, span, 'bold'), 'bold')).toEqual(['', '']);
  });

  it('ADDS across the whole span when only part of it is already marked', () => {
    const pre = toggle(twoParas(), { s: [0, 2], e: [0, 5] }, 'bold');
    expect(marked(toggle(pre, span, 'bold'), 'bold')).toEqual(['llo', 'wor']);
  });

  it('is mark-agnostic — works for the custom highlight mark', () => {
    expect(marked(toggle(twoParas(), span, 'highlight'), 'highlight')).toEqual(['llo', 'wor']);
  });

  it('single-block selection is unaffected (regression guard)', () => {
    const res = toggle(twoParas(), { s: [0, 0], e: [0, 5] }, 'bold');
    expect(marked(res, 'bold')).toEqual(['hello', '']);
  });
});