import { describe, expect, it } from 'vitest';
import { fromColumnar, toColumnar } from './editor-columnar';
import { applyOpToColumnar } from './editor-columnar-ops';
import { blockPointAt, flatPosOfBlockChar, moveBlockSpanOp } from './editor-columnar-mutations';
import { ASTBlockNode, ASTDocument, LogicalSelection } from './editor.types';

const p = (text: string): ASTBlockNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const img = (src: string): ASTBlockNode => ({ type: 'image', attrs: { src }, content: [] });
const list = (...items: string[]): ASTBlockNode => ({
  type: 'bullet-list',
  content: items.map((t) => ({ type: 'list-item', content: [{ type: 'text', text: t }] })),
});

const DOC: ASTDocument = [p('one'), p('two'), p('three'), p('four')];

/** Flat position of `charOffset` inside block `blockIndex`. */
function posIn(doc: ASTDocument, blockIndex: number, charOffset: number): number {
  return flatPosOfBlockChar(toColumnar(doc), { blockIndex, charOffset });
}

/** Apply a move and report the resulting block texts plus where selection landed. */
function move(doc: ASTDocument, first: number, count: number, direction: -1 | 1, sel: LogicalSelection) {
  const cd = toColumnar(doc);
  const mutation = moveBlockSpanOp(cd, first, count, direction, sel);
  if (!mutation) return null;
  const applied = toColumnar(doc);
  applyOpToColumnar(applied, mutation.op);
  const next = fromColumnar(applied);
  return {
    texts: next.map((b) => (b.content[0] as { text?: string })?.text ?? `<${b.type}>`),
    doc: next,
    selAfter: mutation.selAfter,
    fromBlock: blockPointAt(applied, mutation.selAfter.from).blockIndex,
    toBlock: blockPointAt(applied, mutation.selAfter.to).blockIndex,
  };
}

describe('moveBlockSpanOp', () => {
  it('moves a single block down past its neighbour', () => {
    const caret = { from: posIn(DOC, 0, 1), to: posIn(DOC, 0, 1) };
    expect(move(DOC, 0, 1, 1, caret)!.texts).toEqual(['two', 'one', 'three', 'four']);
  });

  it('moves a single block up past its neighbour', () => {
    const caret = { from: posIn(DOC, 2, 0), to: posIn(DOC, 2, 0) };
    expect(move(DOC, 2, 1, -1, caret)!.texts).toEqual(['one', 'three', 'two', 'four']);
  });

  it('carries the caret with its block, at the same offset', () => {
    const caret = { from: posIn(DOC, 0, 2), to: posIn(DOC, 0, 2) };
    const result = move(DOC, 0, 1, 1, caret)!;
    expect(result.fromBlock).toBe(1);
    expect(blockPointAt(toColumnar(result.doc), result.selAfter.from).charOffset).toBe(2);
  });

  it('moves a multi-block span as one unit, keeping the selection on it', () => {
    const sel = { from: posIn(DOC, 0, 1), to: posIn(DOC, 1, 2) };
    const result = move(DOC, 0, 2, 1, sel)!;
    expect(result.texts).toEqual(['three', 'one', 'two', 'four']);
    expect([result.fromBlock, result.toBlock]).toEqual([1, 2]);
  });

  it('keeps blocks of different sizes intact — lists and voids', () => {
    const doc: ASTDocument = [p('intro'), list('a', 'b', 'c'), img('x.png'), p('outro')];
    const caret = { from: posIn(doc, 2, 0), to: posIn(doc, 2, 0) };
    const up = move(doc, 2, 1, -1, caret)!;
    expect(up.doc.map((b) => b.type)).toEqual(['paragraph', 'image', 'bullet-list', 'paragraph']);
    expect(up.fromBlock).toBe(1);
    // The list survived the hop with all of its items.
    expect(up.doc[2].content).toHaveLength(3);
  });

  it('the neighbour it jumped shifts back by the span length', () => {
    const doc: ASTDocument = [p('a'), p('b'), p('c'), p('d')];
    // Selection sits on the neighbour ('c'), while blocks 0-1 move down over it.
    const sel = { from: posIn(doc, 2, 0), to: posIn(doc, 2, 1) };
    const result = move(doc, 0, 2, 1, sel)!;
    expect(result.texts).toEqual(['c', 'a', 'b', 'd']);
    expect(result.fromBlock).toBe(0);
  });

  it('returns null at the document edges', () => {
    const sel = { from: 0, to: 0 };
    expect(moveBlockSpanOp(toColumnar(DOC), 0, 1, -1, sel)).toBeNull();
    expect(moveBlockSpanOp(toColumnar(DOC), 3, 1, 1, sel)).toBeNull();
    expect(moveBlockSpanOp(toColumnar(DOC), 0, 4, 1, sel)).toBeNull();
    expect(moveBlockSpanOp(toColumnar(DOC), 0, 4, -1, sel)).toBeNull();
  });

  it('rejects out-of-range spans', () => {
    const sel = { from: 0, to: 0 };
    expect(moveBlockSpanOp(toColumnar(DOC), -1, 1, 1, sel)).toBeNull();
    expect(moveBlockSpanOp(toColumnar(DOC), 0, 0, 1, sel)).toBeNull();
    expect(moveBlockSpanOp(toColumnar(DOC), 2, 5, 1, sel)).toBeNull();
  });

  it('walks a span through the document on repeated moves', () => {
    let doc = DOC;
    let sel: LogicalSelection = { from: posIn(DOC, 0, 0), to: posIn(DOC, 1, 3) };
    for (let i = 0; i < 2; i++) {
      const cd = toColumnar(doc);
      const mutation = moveBlockSpanOp(cd, i === 0 ? 0 : 1, 2, 1, sel)!;
      const applied = toColumnar(doc);
      applyOpToColumnar(applied, mutation.op);
      doc = fromColumnar(applied);
      sel = mutation.selAfter;
    }
    expect(doc.map((b) => (b.content[0] as { text?: string }).text)).toEqual(['three', 'four', 'one', 'two']);
    const final = toColumnar(doc);
    expect(blockPointAt(final, sel.from).blockIndex).toBe(2);
    expect(blockPointAt(final, sel.to).blockIndex).toBe(3);
  });
});
