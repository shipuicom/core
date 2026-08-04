import { describe, expect, it } from 'vitest';
import { createDocument, getText } from './document';
import { FlatRange, FlatSelection, flatCaret, primaryFlat } from './flat-motion';
import {
  addFlatRange,
  allOccurrences,
  applyMotionAll,
  collapseToPrimary,
  fanOutEdit,
  isMultiRange,
  mapSelectionThroughChanges,
  nextOccurrence,
  normalizeSelection,
  rangesInSpan,
  setPrimaryRange,
} from './flat-multi';
import { indexFor } from './line-index';
import { applyFlatChanges } from './flat-edit';

const r = (anchor: number, head: number): FlatRange => ({ anchor, head });
const spans = (sel: FlatSelection) => sel.ranges.map((x) => [x.anchor, x.head]);

describe('normalizeSelection', () => {
  it('sorts ranges by their ordered start', () => {
    const sel = normalizeSelection([r(30, 35), r(4, 8), r(12, 12)]);
    expect(spans(sel)).toEqual([
      [4, 8],
      [12, 12],
      [30, 35],
    ]);
  });

  it('sorts by the ordered start even when a range runs backwards', () => {
    // head < anchor: the range covers [4, 9] and belongs first.
    const sel = normalizeSelection([r(20, 25), r(9, 4)]);
    expect(spans(sel)).toEqual([
      [9, 4],
      [20, 25],
    ]);
  });

  it('merges overlapping ranges into one cursor', () => {
    const sel = normalizeSelection([r(0, 10), r(5, 15)]);
    expect(spans(sel)).toEqual([[0, 15]]);
  });

  it('merges touching ranges — a caret at a selection edge is inside it', () => {
    const sel = normalizeSelection([r(0, 5), r(5, 5)]);
    expect(spans(sel)).toEqual([[0, 5]]);
  });

  it('dedupes identical carets', () => {
    const sel = normalizeSelection([r(7, 7), r(7, 7), r(7, 7)]);
    expect(spans(sel)).toEqual([[7, 7]]);
  });

  it('keeps distinct carets that do not touch', () => {
    const sel = normalizeSelection([r(7, 7), r(8, 8)]);
    expect(spans(sel)).toEqual([
      [7, 7],
      [8, 8],
    ]);
  });

  it('follows the primary through the sort', () => {
    const sel = normalizeSelection([r(30, 35), r(4, 8), r(12, 12)], 0);
    expect(sel.primary).toBe(2);
    expect(primaryFlat(sel)).toEqual({ anchor: 30, head: 35 });
  });

  it('gives a merged range the primary’s direction, so dragging keeps its grip', () => {
    // The primary runs backwards; the merged cursor must keep running backwards.
    const sel = normalizeSelection([r(0, 10), r(20, 5)], 1);
    expect(spans(sel)).toEqual([[20, 0]]);
    expect(sel.primary).toBe(0);
  });

  it('keeps a non-primary range’s direction when the primary is elsewhere', () => {
    const sel = normalizeSelection([r(0, 10), r(5, 15), r(40, 40)], 2);
    expect(spans(sel)).toEqual([
      [0, 15],
      [40, 40],
    ]);
    expect(sel.primary).toBe(1);
  });

  it('preserves the goal column of the direction-owning range', () => {
    const sel = normalizeSelection([{ anchor: 0, head: 4, goalColumn: 9 }]);
    expect(sel.ranges[0].goalColumn).toBe(9);
  });

  it('returns a single caret for an empty range list', () => {
    expect(spans(normalizeSelection([]))).toEqual([[0, 0]]);
  });
});

describe('range set operations', () => {
  it('makes an added cursor the primary', () => {
    const sel = addFlatRange(flatCaret(50), r(10, 10));
    expect(spans(sel)).toEqual([
      [10, 10],
      [50, 50],
    ]);
    expect(primaryFlat(sel)).toEqual({ anchor: 10, head: 10 });
  });

  it('replaces the primary and leaves the other cursors alone', () => {
    const sel = addFlatRange(flatCaret(50), r(10, 10));
    const moved = setPrimaryRange(sel, r(90, 95));
    expect(spans(moved)).toEqual([
      [50, 50],
      [90, 95],
    ]);
    expect(primaryFlat(moved)).toEqual({ anchor: 90, head: 95 });
  });

  it('collapses to the primary', () => {
    const sel = addFlatRange(addFlatRange(flatCaret(50), r(10, 10)), r(90, 90));
    expect(isMultiRange(sel)).toBe(true);
    const collapsed = collapseToPrimary(sel);
    expect(spans(collapsed)).toEqual([[90, 90]]);
    expect(collapsed.primary).toBe(0);
    expect(isMultiRange(collapsed)).toBe(false);
  });

  it('leaves a single-range selection untouched when collapsing', () => {
    const sel = flatCaret(3);
    expect(collapseToPrimary(sel)).toBe(sel);
  });
});

describe('rangesInSpan', () => {
  const many = normalizeSelection(Array.from({ length: 500 }, (_, i) => r(i * 10, i * 10 + 4)));

  it('returns only the ranges intersecting the span', () => {
    expect(rangesInSpan(many, 100, 124)).toEqual([
      { anchor: 100, head: 104 },
      { anchor: 110, head: 114 },
      { anchor: 120, head: 124 },
    ]);
  });

  it('includes a range that merely straddles the span start', () => {
    expect(rangesInSpan(many, 102, 105)).toEqual([{ anchor: 100, head: 104 }]);
  });

  it('excludes a range ending exactly before the span', () => {
    expect(rangesInSpan(many, 105, 109)).toEqual([]);
  });

  it('handles a span past the last range', () => {
    expect(rangesInSpan(many, 100_000, 200_000)).toEqual([]);
  });

  it('handles a span before the first range', () => {
    const shifted = normalizeSelection([r(500, 510)]);
    expect(rangesInSpan(shifted, 0, 100)).toEqual([]);
  });

  it('finds backwards ranges by their covered span', () => {
    const sel = normalizeSelection([r(40, 20)]);
    expect(rangesInSpan(sel, 25, 30)).toEqual([{ anchor: 40, head: 20 }]);
  });
});

describe('fanOutEdit', () => {
  it('emits changes highest-first so the offsets stay valid', () => {
    const sel = normalizeSelection([r(10, 10), r(20, 20), r(30, 30)]);
    const out = fanOutEdit(sel, (range) => ({
      change: { from: range.head, to: range.head, insert: 'ab' },
      anchorAfter: range.head + 2,
      headAfter: range.head + 2,
    }))!;
    expect(out.changes.map((c) => c.from)).toEqual([30, 20, 10]);
  });

  it('shifts each cursor by the edits below it', () => {
    const sel = normalizeSelection([r(10, 10), r(20, 20), r(30, 30)]);
    const out = fanOutEdit(sel, (range) => ({
      change: { from: range.head, to: range.head, insert: 'ab' },
      anchorAfter: range.head + 2,
      headAfter: range.head + 2,
    }))!;
    // 12 = 10 + own insert; 24 = 20 + own insert + one below; 36 likewise.
    expect(spans(out.selection)).toEqual([
      [12, 12],
      [24, 24],
      [36, 36],
    ]);
  });

  it('agrees with actually applying the changes', () => {
    const doc = createDocument('one\ntwo\nthree');
    const index = indexFor(doc);
    const heads = [0, index.startOf(1), index.startOf(2)];
    const sel = normalizeSelection(heads.map((h) => r(h, h)));
    const out = fanOutEdit(sel, (range) => ({
      change: { from: range.head, to: range.head, insert: '> ' },
      anchorAfter: range.head + 2,
      headAfter: range.head + 2,
    }))!;
    const { doc: next } = applyFlatChanges(doc, out.changes);
    expect(getText(next)).toBe('> one\n> two\n> three');
    // Every cursor sits just past its own inserted prefix.
    const nextIndex = indexFor(next);
    expect(out.selection.ranges.map((x) => nextIndex.pointAt(x.head))).toEqual([
      { line: 0, column: 2 },
      { line: 1, column: 2 },
      { line: 2, column: 2 },
    ]);
  });

  it('keeps a cursor that has nothing to do, shifted by the others', () => {
    const sel = normalizeSelection([r(10, 10), r(20, 20)]);
    const out = fanOutEdit(sel, (range, i) =>
      i === 0
        ? { change: { from: range.head, to: range.head, insert: 'xyz' }, anchorAfter: range.head + 3, headAfter: range.head + 3 }
        : null
    )!;
    expect(spans(out.selection)).toEqual([
      [13, 13],
      [23, 23],
    ]);
  });

  it('returns null when no cursor produced a change', () => {
    const sel = normalizeSelection([r(10, 10), r(20, 20)]);
    expect(fanOutEdit(sel, () => null)).toBeNull();
  });

  it('merges cursors that collide after the edit', () => {
    // Two carets one apart; each deletes the character before it, so both end
    // up at the same place and become one cursor.
    const sel = normalizeSelection([r(10, 10), r(11, 11)]);
    const out = fanOutEdit(sel, (range) => ({
      change: { from: range.head - 1, to: range.head, insert: '' },
      anchorAfter: range.head - 1,
      headAfter: range.head - 1,
    }))!;
    expect(spans(out.selection)).toEqual([[9, 9]]);
  });
});

describe('mapSelectionThroughChanges', () => {
  it('carries every cursor through an insert below them', () => {
    const sel = normalizeSelection([r(10, 10), r(20, 25)]);
    const mapped = mapSelectionThroughChanges(sel, [{ from: 0, to: 0, insert: 'abcde' }]);
    expect(spans(mapped)).toEqual([
      [15, 15],
      [25, 30],
    ]);
  });

  it('keeps the primary through the mapping', () => {
    const sel = normalizeSelection([r(10, 10), r(20, 20)], 1);
    const mapped = mapSelectionThroughChanges(sel, [{ from: 0, to: 0, insert: 'ab' }]);
    expect(primaryFlat(mapped)).toEqual({ anchor: 22, head: 22 });
  });
});

describe('applyMotionAll', () => {
  it('moves every cursor', () => {
    const sel = normalizeSelection([r(5, 5), r(15, 15)]);
    const moved = applyMotionAll(sel, (pos) => ({ head: pos + 1 }), false);
    expect(spans(moved)).toEqual([
      [6, 6],
      [16, 16],
    ]);
  });

  it('extends every cursor when asked, keeping each anchor', () => {
    const sel = normalizeSelection([r(5, 5), r(15, 15)]);
    const moved = applyMotionAll(sel, (pos) => ({ head: pos + 2 }), true);
    expect(spans(moved)).toEqual([
      [5, 7],
      [15, 17],
    ]);
  });

  it('collapses a non-empty range to the requested edge instead of moving', () => {
    const sel = normalizeSelection([r(5, 10)]);
    const moved = applyMotionAll(sel, (pos) => ({ head: pos + 1 }), false, 'from');
    expect(spans(moved)).toEqual([[5, 5]]);
  });

  it('merges cursors that land on each other', () => {
    // Both clamp to the document start, so two cursors become one.
    const sel = normalizeSelection([r(0, 0), r(1, 1)]);
    const moved = applyMotionAll(sel, (pos) => ({ head: Math.max(0, pos - 1) }), false);
    expect(spans(moved)).toEqual([[0, 0]]);
  });
});

describe('occurrence search', () => {
  const text = getText(createDocument('foo bar\nbaz foo\nfoo'));

  it('flat positions are string indices, so matches need no translation', () => {
    const index = indexFor(createDocument('foo bar\nbaz foo\nfoo'));
    expect(index.startOf(1)).toBe(text.indexOf('baz'));
  });

  it('finds the next occurrence at or after a position', () => {
    expect(nextOccurrence(text, 'foo', 0)).toEqual({ from: 0, to: 3 });
    expect(nextOccurrence(text, 'foo', 1)).toEqual({ from: 12, to: 15 });
  });

  it('wraps to the top when nothing follows', () => {
    expect(nextOccurrence(text, 'foo', 17)).toEqual({ from: 0, to: 3 });
  });

  it('returns null for a needle that is not present', () => {
    expect(nextOccurrence(text, 'zzz', 0)).toBeNull();
    expect(nextOccurrence(text, '', 0)).toBeNull();
  });

  it('finds every occurrence in document order', () => {
    expect(allOccurrences(text, 'foo')).toEqual([
      { from: 0, to: 3 },
      { from: 12, to: 15 },
      { from: 16, to: 19 },
    ]);
  });

  it('honours the cap — a short needle in a big file must not become a cursor storm', () => {
    const big = 'ab'.repeat(50_000);
    expect(allOccurrences(big, 'a', 100)).toHaveLength(100);
  });

  it('does not overlap matches', () => {
    expect(allOccurrences('aaaa', 'aa')).toEqual([
      { from: 0, to: 2 },
      { from: 2, to: 4 },
    ]);
  });
});
