import { describe, expect, it } from 'vitest';
import { createDocument, getText } from './document';
import { applyFlatChanges } from './flat-edit';
import { FlatSelection, flatCaret, flatRange } from './flat-motion';
import { indexFor } from './line-index';
import { moveLines, selectedLineGroups, selectedLineSpan } from './line-move';
import { normalizeSelection } from './flat-multi';

const DOC = 'one\ntwo\nthree\nfour';

/** Apply a move and report the resulting text plus the selected substring. */
function run(text: string, selection: FlatSelection, direction: -1 | 1) {
  const doc = createDocument(text);
  const move = moveLines(doc, selection, direction);
  if (!move) return null;
  const { doc: next } = applyFlatChanges(doc, move.changes);
  const range = move.selection.ranges[0];
  const from = Math.min(range.anchor, range.head);
  const to = Math.max(range.anchor, range.head);
  return { text: getText(next), selected: indexFor(next).sliceText(from, to), range };
}

/** Caret at (line, column). */
function caretAt(text: string, line: number, column: number): FlatSelection {
  return flatCaret(indexFor(createDocument(text)).posOf({ line, column }));
}

/** Selection sweeping from (line, col) to (line, col). */
function rangeAt(text: string, a: [number, number], b: [number, number]): FlatSelection {
  const index = indexFor(createDocument(text));
  return flatRange(index.posOf({ line: a[0], column: a[1] }), index.posOf({ line: b[0], column: b[1] }));
}

describe('selectedLineSpan', () => {
  it('a caret spans its own line', () => {
    expect(selectedLineSpan(createDocument(DOC), caretAt(DOC, 2, 1))).toEqual({ first: 2, last: 2 });
  });

  it('a sweep spans every line it touches', () => {
    expect(selectedLineSpan(createDocument(DOC), rangeAt(DOC, [1, 2], [3, 1]))).toEqual({ first: 1, last: 3 });
  });

  it('a selection ending at a line start has not entered that line', () => {
    expect(selectedLineSpan(createDocument(DOC), rangeAt(DOC, [0, 0], [2, 0]))).toEqual({ first: 0, last: 1 });
  });
});

describe('moveLines', () => {
  it('moves the caret line down past its neighbour', () => {
    expect(run(DOC, caretAt(DOC, 0, 1), 1)?.text).toBe('two\none\nthree\nfour');
  });

  it('moves the caret line up past its neighbour', () => {
    expect(run(DOC, caretAt(DOC, 2, 0), -1)?.text).toBe('one\nthree\ntwo\nfour');
  });

  it('keeps the caret on its line, at the same column', () => {
    const result = run(DOC, caretAt(DOC, 0, 3), 1)!;
    const index = indexFor(createDocument(result.text));
    expect(index.pointAt(result.range.head)).toEqual({ line: 1, column: 3 });
  });

  it('moves a multi-line selection as one unit, keeping it selected', () => {
    const down = run(DOC, rangeAt(DOC, [0, 1], [1, 2]), 1)!;
    expect(down.text).toBe('three\none\ntwo\nfour');
    expect(down.selected).toBe('ne\ntw');

    const up = run(DOC, rangeAt(DOC, [2, 0], [3, 4]), -1)!;
    expect(up.text).toBe('one\nthree\nfour\ntwo');
    expect(up.selected).toBe('three\nfour');
  });

  it('holding the shortcut walks a span through the document', () => {
    let doc = createDocument(DOC);
    let selection: FlatSelection = rangeAt(DOC, [0, 0], [1, 3]);
    for (let i = 0; i < 2; i++) {
      const move = moveLines(doc, selection, 1)!;
      doc = applyFlatChanges(doc, move.changes).doc;
      selection = move.selection;
    }
    expect(getText(doc)).toBe('three\nfour\none\ntwo');
    const range = selection.ranges[0];
    expect(indexFor(doc).sliceText(range.anchor, range.head)).toBe('one\ntwo');
  });

  it('returns null at the document edges', () => {
    expect(moveLines(createDocument(DOC), caretAt(DOC, 0, 0), -1)).toBeNull();
    expect(moveLines(createDocument(DOC), caretAt(DOC, 3, 0), 1)).toBeNull();
    expect(moveLines(createDocument(DOC), rangeAt(DOC, [0, 0], [3, 4]), 1)).toBeNull();
  });

  it('handles a single-line document and empty neighbours', () => {
    expect(moveLines(createDocument('only'), caretAt('only', 0, 0), 1)).toBeNull();
    const withBlank = 'a\n\nb';
    expect(run(withBlank, caretAt(withBlank, 2, 1), -1)?.text).toBe('a\nb\n');
  });

  it('preserves the goal column across the move', () => {
    const doc = createDocument(DOC);
    const sel: FlatSelection = { ranges: [{ anchor: 0, head: 0, goalColumn: 7 }] };
    expect(moveLines(doc, sel, 1)!.selection.ranges[0].goalColumn).toBe(7);
  });
});

describe('moveLines with several cursors', () => {
  const SIX = 'a\nb\nc\nd\ne\nf';

  /** Carets on each of `lines`, at column 0. */
  function caretsOn(text: string, lines: number[]): FlatSelection {
    const index = indexFor(createDocument(text));
    return normalizeSelection(lines.map((line) => {
      const at = index.posOf({ line, column: 0 });
      return { anchor: at, head: at };
    }));
  }

  /** Apply a move and report the resulting text. */
  function runMulti(text: string, selection: FlatSelection, direction: -1 | 1) {
    const doc = createDocument(text);
    const move = moveLines(doc, selection, direction);
    if (!move) return null;
    return { text: getText(applyFlatChanges(doc, move.changes).doc), selection: move.selection };
  }

  it('merges adjacent cursor lines into one travelling block', () => {
    expect(selectedLineGroups(createDocument(SIX), caretsOn(SIX, [1, 2]))).toEqual([{ first: 1, last: 2 }]);
  });

  it('keeps separated cursor lines as distinct groups', () => {
    expect(selectedLineGroups(createDocument(SIX), caretsOn(SIX, [1, 4]))).toEqual([
      { first: 1, last: 1 },
      { first: 4, last: 4 },
    ]);
  });

  it('collapses two cursors sharing a line into one group', () => {
    const index = indexFor(createDocument(SIX));
    const sel = normalizeSelection([
      { anchor: index.posOf({ line: 2, column: 0 }), head: index.posOf({ line: 2, column: 0 }) },
      { anchor: index.posOf({ line: 2, column: 1 }), head: index.posOf({ line: 2, column: 1 }) },
    ]);
    expect(selectedLineGroups(createDocument(SIX), sel)).toEqual([{ first: 2, last: 2 }]);
  });

  it('moves separated groups independently', () => {
    expect(runMulti(SIX, caretsOn(SIX, [1, 4]), -1)!.text).toBe('b\na\nc\ne\nd\nf');
  });

  it('moves separated groups down independently', () => {
    expect(runMulti(SIX, caretsOn(SIX, [1, 4]), 1)!.text).toBe('a\nc\nb\nd\nf\ne');
  });

  it('carries every cursor along with its own line', () => {
    const doc = createDocument(SIX);
    const move = moveLines(doc, caretsOn(SIX, [1, 4]), -1)!;
    const next = applyFlatChanges(doc, move.changes).doc;
    const index = indexFor(next);
    // 'b' moved to line 0 and 'e' to line 3; both carets came with them.
    expect(move.selection.ranges.map((r) => index.pointAt(r.head).line)).toEqual([0, 3]);
    expect(move.selection.ranges.map((r) => index.pointAt(r.head).line).map((l) => next.lines[l].text)).toEqual(['b', 'e']);
  });

  it('lets the lower groups move when the top one is pinned at the edge', () => {
    expect(runMulti(SIX, caretsOn(SIX, [0, 3]), -1)!.text).toBe('a\nb\nd\nc\ne\nf');
  });

  it('lets the upper groups move when the bottom one is pinned at the edge', () => {
    expect(runMulti(SIX, caretsOn(SIX, [2, 5]), 1)!.text).toBe('a\nb\nd\nc\ne\nf');
  });

  it('returns null only when every group is pinned', () => {
    expect(moveLines(createDocument(SIX), caretsOn(SIX, [0]), -1)).toBeNull();
    expect(moveLines(createDocument(SIX), caretsOn(SIX, [0, 1]), -1)).toBeNull();
    expect(moveLines(createDocument(SIX), caretsOn(SIX, [4, 5]), 1)).toBeNull();
  });

  it('emits one change covering only the lines that actually shifted', () => {
    const doc = createDocument(SIX);
    const index = indexFor(doc);
    const move = moveLines(doc, caretsOn(SIX, [4]), -1)!;
    expect(move.changes).toHaveLength(1);
    expect(move.changes[0].from).toBe(index.startOf(3));
    expect(move.changes[0].to).toBe(index.endOf(4));
  });

  it('keeps the primary cursor primary across the move', () => {
    const sel = caretsOn(SIX, [1, 4]);
    const move = moveLines(createDocument(SIX), { ...sel, primary: 1 }, -1)!;
    expect(move.selection.primary).toBe(1);
  });
});
