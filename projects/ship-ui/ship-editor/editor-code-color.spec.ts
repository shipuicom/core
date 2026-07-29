import { describe, expect, it } from 'vitest';
import { alignStyledCode } from './editor-serializers';
import { ASTDocument, ASTInlineNode } from './editor.types';

const blue = { type: 'style', attrs: { color: '#569cd6' } };
const green = { type: 'style', attrs: { color: '#6a9955' } };

/** One paragraph per "line", the shape htmlToAst gives VS Code clipboard HTML. */
const styledLines = (lines: ASTInlineNode[][]): ASTDocument => lines.map((content) => ({ type: 'paragraph', content }));

describe('alignStyledCode', () => {
  it('rides marks onto the plain text across whitespace differences', () => {
    // Plain uses \n and \t; the HTML flavor lost the tab and split lines.
    const plain = 'if (x) {\n\treturn 1;\n}';
    const styled = styledLines([
      [{ type: 'text', text: 'if', marks: [blue] }, { type: 'text', text: ' (x) {' }],
      [{ type: 'text', text: '  ' }, { type: 'text', text: 'return', marks: [blue] }, { type: 'text', text: ' 1;' }],
      [{ type: 'text', text: '}' }],
    ]);
    const out = alignStyledCode(plain, styled)!;
    expect(out).not.toBeNull();
    expect(out.map((n) => n.text).join('')).toBe(plain); // text is exactly the plain flavor
    expect(out[0]).toEqual({ type: 'text', text: 'if', marks: [blue] });
    const returnNode = out.find((n) => n.text.includes('return'))!;
    expect(returnNode.marks).toEqual([blue]);
    // The tab between them carries no marks.
    const tabNode = out.find((n) => n.text.includes('\t'))!;
    expect(tabNode.marks).toBeUndefined();
  });

  it('merges adjacent equal-mark runs and unmarked whitespace into one node', () => {
    const out = alignStyledCode('ab cd', styledLines([[{ type: 'text', text: 'ab cd' }]]))!;
    expect(out).toEqual([{ type: 'text', text: 'ab cd' }]);
  });

  it('keeps distinct colors distinct', () => {
    const out = alignStyledCode(
      'a b',
      styledLines([[{ type: 'text', text: 'a', marks: [blue] }, { type: 'text', text: ' ' }, { type: 'text', text: 'b', marks: [green] }]])
    )!;
    expect(out.map((n) => ({ t: n.text, m: n.marks?.[0]?.attrs?.['color'] ?? null }))).toEqual([
      { t: 'a', m: '#569cd6' },
      { t: ' ', m: null },
      { t: 'b', m: '#6a9955' },
    ]);
  });

  it('returns null when the flavors disagree on content', () => {
    expect(alignStyledCode('abc', styledLines([[{ type: 'text', text: 'abd' }]]))).toBeNull(); // wrong char
    expect(alignStyledCode('abc', styledLines([[{ type: 'text', text: 'ab' }]]))).toBeNull(); // html too short
    expect(alignStyledCode('ab', styledLines([[{ type: 'text', text: 'abc' }]]))).toBeNull(); // html too long
  });

  it('containers in the styled fragment contribute their items in order', () => {
    const styled: ASTDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'a', marks: [blue] }] },
          { type: 'list-item', content: [{ type: 'text', text: 'b' }] },
        ],
      },
    ];
    const out = alignStyledCode('a\nb', styled)!;
    expect(out[0]).toEqual({ type: 'text', text: 'a', marks: [blue] });
  });

  it('pure-whitespace plain text needs no styled characters', () => {
    expect(alignStyledCode('\n\t', [])).toEqual([{ type: 'text', text: '\n\t' }]);
  });
});
