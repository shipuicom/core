import { describe, expect, it } from 'vitest';
import { createDocument, getText } from './document';
import { applyFlatChange, applyFlatChanges, mapThroughChanges } from './flat-edit';
import {
  applyMotion,
  flatCaret,
  flatMoveDown,
  flatMoveLeft,
  flatMoveLineEnd,
  flatMoveRight,
  flatMoveUp,
  flatMoveWordRight,
  flatSelectAll,
  flatSelectLine,
  flatSelectWord,
  primaryFlat,
} from './flat-motion';
import { LineIndex, indexFor, mapFlatPos } from './line-index';

const doc3 = () => createDocument('alpha\nbo\ncharlie');

describe('LineIndex — flat positions over the line column', () => {
  it('computes size with one slot per newline', () => {
    // 'alpha'(5) + \n + 'bo'(2) + \n + 'charlie'(7) = 16
    expect(new LineIndex(doc3()).size).toBe(16);
  });

  it('startOf / endOf give line spans', () => {
    const index = new LineIndex(doc3());
    expect(index.startOf(0)).toBe(0);
    expect(index.endOf(0)).toBe(5);
    expect(index.startOf(1)).toBe(6);
    expect(index.endOf(1)).toBe(8);
    expect(index.startOf(2)).toBe(9);
    expect(index.endOf(2)).toBe(16);
  });

  it('lineAt finds the containing line, newline slots belonging to their line', () => {
    const index = new LineIndex(doc3());
    expect(index.lineAt(0)).toBe(0);
    expect(index.lineAt(5)).toBe(0); // on line 0's newline slot
    expect(index.lineAt(6)).toBe(1);
    expect(index.lineAt(16)).toBe(2);
  });

  it('posOf and pointAt are inverses, clamping out-of-range input', () => {
    const index = new LineIndex(doc3());
    expect(index.posOf({ line: 1, column: 1 })).toBe(7);
    expect(index.pointAt(7)).toEqual({ line: 1, column: 1 });
    expect(index.posOf({ line: 1, column: 99 })).toBe(8); // clamped to line length
    expect(index.pointAt(999)).toEqual({ line: 2, column: 7 });
    expect(index.pointAt(-5)).toEqual({ line: 0, column: 0 });
  });

  it('sliceText spans lines with newlines included', () => {
    const index = new LineIndex(doc3());
    expect(index.sliceText(3, 8)).toBe('ha\nbo');
    expect(index.sliceText(0, 16)).toBe('alpha\nbo\ncharlie');
    expect(index.sliceText(8, 8)).toBe('');
  });

  it('indexFor caches per document identity', () => {
    const doc = doc3();
    expect(indexFor(doc)).toBe(indexFor(doc));
    expect(indexFor(doc)).not.toBe(indexFor(doc3()));
  });

  it('handles a single empty line', () => {
    const index = new LineIndex(createDocument(''));
    expect(index.size).toBe(0);
    expect(index.pointAt(0)).toEqual({ line: 0, column: 0 });
  });
});

describe('flat changes', () => {
  it('insert, delete, and replace apply through flat offsets', () => {
    const doc = doc3();
    expect(getText(applyFlatChange(doc, { from: 5, to: 5, insert: '!' }).doc)).toBe('alpha!\nbo\ncharlie');
    expect(getText(applyFlatChange(doc, { from: 3, to: 8, insert: '' }).doc)).toBe('alp\ncharlie');
    expect(getText(applyFlatChange(doc, { from: 0, to: 5, insert: 'x' }).doc)).toBe('x\nbo\ncharlie');
  });

  it('inserting a newline splits, deleting one joins', () => {
    const doc = doc3();
    expect(getText(applyFlatChange(doc, { from: 2, to: 2, insert: '\n' }).doc)).toBe('al\npha\nbo\ncharlie');
    // Deleting line 0's newline slot joins lines 0 and 1.
    expect(getText(applyFlatChange(doc, { from: 5, to: 6, insert: '' }).doc)).toBe('alphabo\ncharlie');
  });

  it('returns the inverse change and replaying it restores the document', () => {
    const doc = doc3();
    const { doc: after, inverse } = applyFlatChange(doc, { from: 3, to: 8, insert: 'XY' });
    expect(getText(after)).toBe('alpXY\ncharlie');
    const restored = applyFlatChanges(after, inverse);
    expect(getText(restored.doc)).toBe('alpha\nbo\ncharlie');
  });

  it('a change sequence applies in order and inverts as a whole', () => {
    const doc = doc3();
    const changes = [
      { from: 0, to: 0, insert: '// ' },
      { from: 8, to: 9, insert: '' },
    ];
    const { doc: after, inverse } = applyFlatChanges(doc, changes);
    const restored = applyFlatChanges(after, inverse);
    expect(getText(restored.doc)).toBe(getText(doc));
  });

  it('maps positions through changes association-right', () => {
    const change = { from: 2, to: 5, insert: 'ab' };
    expect(mapFlatPos(1, change)).toBe(1);
    expect(mapFlatPos(2, change)).toBe(4); // at the change site → rides after the insert
    expect(mapFlatPos(4, change)).toBe(4); // inside the deleted span → change start + insert
    expect(mapFlatPos(5, change)).toBe(4);
    expect(mapFlatPos(9, change)).toBe(8);
    expect(mapThroughChanges(9, [change, { from: 0, to: 0, insert: 'x' }])).toBe(9);
  });

  it('a caret at a pure-insert point rides right with the insert', () => {
    // Tab-indent at column 0: the caret must end up after the inserted spaces.
    expect(mapFlatPos(0, { from: 0, to: 0, insert: '  ' })).toBe(2);
  });
});

describe('flat caret motion', () => {
  it('moveRight is pos + 1 and crosses line boundaries by construction', () => {
    const doc = doc3();
    expect(flatMoveRight(doc, 4).head).toBe(5);
    expect(flatMoveRight(doc, 5).head).toBe(6); // over the newline into line 1
    expect(flatMoveRight(doc, 16).head).toBe(16); // clamped at doc end
    expect(flatMoveLeft(doc, 6).head).toBe(5);
    expect(flatMoveLeft(doc, 0).head).toBe(0);
  });

  it('horizontal motion steps over a surrogate pair as one character', () => {
    // '😀' is two UTF-16 code units; the caret must never land between them.
    const doc = createDocument('a😀b\nc');
    expect(flatMoveRight(doc, 1).head).toBe(3);
    expect(flatMoveLeft(doc, 3).head).toBe(1);
    // Plain characters and the newline still step by one.
    expect(flatMoveRight(doc, 3).head).toBe(4);
    expect(flatMoveRight(doc, 4).head).toBe(5); // over the newline
    expect(flatMoveLeft(doc, 5).head).toBe(4);
  });

  it('vertical motion clamps to shorter lines but keeps the goal column', () => {
    const doc = doc3();
    // Line 0 col 4 → line 1 clamps to col 2, goal stays 4.
    const down = flatMoveDown(doc, 4);
    expect(indexFor(doc).pointAt(down.head)).toEqual({ line: 1, column: 2 });
    expect(down.goalColumn).toBe(4);
    // Continuing down with the goal recovers col 4 on the longer line 2.
    const down2 = flatMoveDown(doc, down.head, down.goalColumn);
    expect(indexFor(doc).pointAt(down2.head)).toEqual({ line: 2, column: 4 });
  });

  it('moveUp from the first line goes to doc start; moveDown from the last to doc end', () => {
    const doc = doc3();
    expect(flatMoveUp(doc, 3).head).toBe(0);
    expect(flatMoveDown(doc, 12).head).toBe(16);
  });

  it('word and line motions agree with the line/column implementations', () => {
    const doc = doc3();
    expect(flatMoveWordRight(doc, 0).head).toBe(5);
    expect(flatMoveLineEnd(doc, 6).head).toBe(8);
  });

  it('select word / line / all produce flat ranges', () => {
    const doc = doc3();
    expect(flatSelectWord(doc, 10)).toEqual({ anchor: 9, head: 16 });
    expect(flatSelectLine(doc, 7)).toEqual({ anchor: 6, head: 8 });
    expect(flatSelectAll(doc)).toEqual({ anchor: 0, head: 16 });
  });

  it('applyMotion extends with Shift and collapses a range to its edge on plain moves', () => {
    const sel = { ranges: [{ anchor: 2, head: 7 }] };
    const extended = applyMotion(sel, { head: 8 }, true);
    expect(primaryFlat(extended)).toEqual({ anchor: 2, head: 8, goalColumn: undefined });
    const collapsedLeft = applyMotion(sel, { head: 6 }, false, 'from');
    expect(primaryFlat(collapsedLeft)).toEqual({ anchor: 2, head: 2, goalColumn: undefined });
    const plain = applyMotion(flatCaret(4), { head: 5 }, false, 'to');
    expect(primaryFlat(plain)).toEqual({ anchor: 5, head: 5, goalColumn: undefined });
  });
});
