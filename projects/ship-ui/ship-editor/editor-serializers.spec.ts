// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { astToMarkdown, htmlToAst, markdownToAst } from './public-api';
import * as B from './standard-behaviors';

function makeMaps() {
  const blocks = new Map<string, any>();
  [new B.ParagraphBehavior(), new B.HeadingBehavior(), new B.BulletListBehavior(), new B.OrderedListBehavior(), new B.ListItemBehavior()].forEach(
    (b) => blocks.set(b.type, b)
  );
  const inlines = new Map<string, any>();
  [new B.BoldBehavior(), new B.ItalicBehavior()].forEach((m) => inlines.set(m.type, m));
  return { blocks, inlines };
}

const expected = [
  { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
  {
    type: 'bullet-list',
    content: [
      { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
      { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
    ],
  },
];

describe('parsers exported from the public entry point', () => {
  it('markdownToAst parses a heading and a list', () => {
    const { blocks, inlines } = makeMaps();
    expect(markdownToAst('## Title\n\n- one\n- two', blocks, inlines)).toEqual(expected);
  });

  it('markdownToAst parses an ordered list', () => {
    const { blocks, inlines } = makeMaps();
    const doc = markdownToAst('1. one\n2. two', blocks, inlines);
    expect(doc[0].type).toBe('ordered-list');
    expect(doc[0].content.map((item: any) => item.content[0].text)).toEqual(['one', 'two']);
  });

  it('htmlToAst parses a heading and a list', () => {
    const { blocks, inlines } = makeMaps();
    expect(htmlToAst('<h2>Title</h2><ul><li>one</li><li>two</li></ul>', blocks, inlines)).toEqual(expected);
  });

  it('a serialized list round-trips through markdownToAst', () => {
    const { blocks, inlines } = makeMaps();
    const md = astToMarkdown([...expected, { type: 'paragraph', content: [{ type: 'text', text: 'after' }] }] as any, blocks, inlines);
    expect(md).toBe('## Title\n\n- one\n- two\n\nafter');
    expect(markdownToAst(md, blocks, inlines).map((b) => b.type)).toEqual(['heading', 'bullet-list', 'paragraph']);
  });
});
