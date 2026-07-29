import { describe, expect, it } from 'vitest';
import { toColumnar } from './editor-columnar';
import { flatPosOfBlockChar, fragmentPlainText, sliceDocument } from './editor-columnar-mutations';
import { ASTBlockNode, ASTDocument } from './editor.types';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });

const doc: ASTDocument = [
  p('alpha'),
  { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'title' }] },
  { type: 'hr', content: [] },
  {
    type: 'bullet-list',
    content: [
      { type: 'list-item', content: [{ type: 'text', text: 'one' }] },
      { type: 'list-item', content: [{ type: 'text', text: 'two' }] },
      { type: 'list-item', content: [{ type: 'text', text: 'three' }] },
    ],
  },
  p('omega'),
];

describe('sliceDocument', () => {
  it('a full-document selection reproduces every block', () => {
    const cd = toColumnar(doc);
    const out = sliceDocument(cd, { from: 0, to: cd.size });
    expect(out.map((b) => b.type)).toEqual(['paragraph', 'heading', 'hr', 'bullet-list', 'paragraph']);
    expect(out[1].attrs).toEqual({ level: 2 });
    expect((out[3].content as ASTBlockNode[]).length).toBe(3);
    expect(fragmentPlainText(out)).toBe('alpha\n\ntitle\n\none\ntwo\nthree\n\nomega');
  });

  it('trims the boundary blocks to the selection offsets', () => {
    const cd = toColumnar(doc);
    const from = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 3 }); // alp|ha
    const to = flatPosOfBlockChar(cd, { blockIndex: 1, charOffset: 2 }); // ti|tle
    const out = sliceDocument(cd, { from, to });
    expect(out).toHaveLength(2);
    expect((out[0].content as any[])[0].text).toBe('ha');
    expect((out[1].content as any[])[0].text).toBe('ti');
  });

  it('slices container items and trims their boundary text', () => {
    const cd = toColumnar(doc);
    const from = flatPosOfBlockChar(cd, { blockIndex: 3, itemIndex: 1, charOffset: 1 }); // t|wo
    const to = flatPosOfBlockChar(cd, { blockIndex: 4, charOffset: 2 }); // om|ega
    const out = sliceDocument(cd, { from, to });
    expect(out.map((b) => b.type)).toEqual(['bullet-list', 'paragraph']);
    const items = out[0].content as ASTBlockNode[];
    expect(items).toHaveLength(2);
    expect((items[0].content as any[])[0].text).toBe('wo');
    expect((items[1].content as any[])[0].text).toBe('three');
    expect((out[1].content as any[])[0].text).toBe('om');
  });

  it('a same-block selection yields one trimmed block', () => {
    const cd = toColumnar(doc);
    const from = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 1 });
    const to = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 4 });
    const out = sliceDocument(cd, { from, to });
    expect(out).toHaveLength(1);
    expect((out[0].content as any[])[0].text).toBe('lph');
  });

  it('voids inside the range are carried whole', () => {
    const cd = toColumnar(doc);
    const from = flatPosOfBlockChar(cd, { blockIndex: 1, charOffset: 0 });
    const to = flatPosOfBlockChar(cd, { blockIndex: 3, itemIndex: 0, charOffset: 3 });
    const out = sliceDocument(cd, { from, to });
    expect(out.map((b) => b.type)).toEqual(['heading', 'hr', 'bullet-list']);
    expect((out[2].content as ASTBlockNode[]).length).toBe(1);
  });

  it('marks survive slicing, clipped to the kept span', () => {
    const marked: ASTDocument = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'ab' },
          { type: 'text', text: 'cd', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'ef' },
        ],
      },
    ];
    const cd = toColumnar(marked);
    const from = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 3 }); // inside the bold run
    const to = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 6 });
    const out = sliceDocument(cd, { from, to });
    const nodes = out[0].content as any[];
    expect(nodes[0]).toEqual({ type: 'text', text: 'd', marks: [{ type: 'bold' }] });
    expect(nodes[1]).toEqual({ type: 'text', text: 'ef' });
  });

  it('an empty or collapsed selection yields nothing', () => {
    const cd = toColumnar(doc);
    expect(sliceDocument(cd, { from: 3, to: 3 })).toEqual([]);
    expect(sliceDocument(toColumnar([]), { from: 0, to: 5 })).toEqual([]);
  });

  it('a reversed selection behaves like its normalized form', () => {
    const cd = toColumnar(doc);
    const from = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 1 });
    const to = flatPosOfBlockChar(cd, { blockIndex: 1, charOffset: 2 });
    expect(sliceDocument(cd, { from: to, to: from })).toEqual(sliceDocument(cd, { from, to }));
  });
});
