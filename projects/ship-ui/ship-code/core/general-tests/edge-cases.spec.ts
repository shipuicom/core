import { describe, it, expect } from 'vitest';
import {
  createDocument,
  getLine,
  lineCount,
  getText,
  insertText,
  deleteRange,
  applyTransaction,
} from '../document';
import { caret } from '../selection';
import {
  moveCaretRight,
  moveCaretLeft,
  moveCaretUp,
  moveCaretDown,
  moveWordLeft,
  moveWordRight,
  moveLineStart,
  moveLineEnd,
  moveDocStart,
  moveDocEnd,
  selectWord,
  selectLine,
  selectAll,
} from '../caret-motion';

/**
 * Edge-case and hardening tests.
 * These cover boundary conditions, empty documents, out-of-bounds positions,
 * and scenarios the main test files don't cover.
 */

// ---------------------------------------------------------------------------
// Document: edge cases
// ---------------------------------------------------------------------------

describe('document edge cases', () => {
  it('deleteRange with zero-width range should be a no-op', () => {
    const doc = createDocument('hello');
    const result = deleteRange(doc, { line: 0, column: 2 }, { line: 0, column: 2 });
    expect(getLine(result, 0)).toBe('hello');
  });

  it('insertText with empty string should be a no-op', () => {
    const doc = createDocument('hello');
    const result = insertText(doc, { line: 0, column: 3 }, '');
    expect(getLine(result, 0)).toBe('hello');
  });

  it('applyTransaction with empty changes array should return unchanged doc', () => {
    const doc = createDocument('hello');
    const result = applyTransaction(doc, { changes: [] });
    expect(getText(result)).toBe('hello');
  });

  it('applyTransaction with no-op change (empty insert, same from/to)', () => {
    const doc = createDocument('hello');
    const result = applyTransaction(doc, {
      changes: [{ from: caret(0, 2), to: caret(0, 2), insert: '' }],
    });
    expect(getText(result)).toBe('hello');
  });

  it('insertText at column beyond line length should append', () => {
    const doc = createDocument('hi');
    // Column 10 is past end of "hi" (length 2) — slice(10) returns ''
    const result = insertText(doc, { line: 0, column: 10 }, '!');
    expect(getLine(result, 0)).toBe('hi!');
  });

  it('deleteRange where from column is past line end should not crash', () => {
    const doc = createDocument('hi');
    const result = deleteRange(doc, { line: 0, column: 5 }, { line: 0, column: 10 });
    // slice(0, 5) on "hi" = "hi", slice(10) on "hi" = "" → "hi"
    expect(getLine(result, 0)).toBe('hi');
  });

  it('createDocument normalizes Windows line endings (\\r\\n) to \\n', () => {
    const doc = createDocument('hello\r\nworld');
    expect(lineCount(doc)).toBe(2);
    expect(getLine(doc, 0)).toBe('hello');
    expect(getLine(doc, 1)).toBe('world');
  });

  it('createDocument normalizes bare \\r to \\n', () => {
    const doc = createDocument('hello\rworld');
    expect(lineCount(doc)).toBe(2);
    expect(getLine(doc, 0)).toBe('hello');
    expect(getLine(doc, 1)).toBe('world');
  });

  it('insertText with only newlines creates empty lines', () => {
    const doc = createDocument('AB');
    const result = insertText(doc, { line: 0, column: 1 }, '\n\n');
    expect(lineCount(result)).toBe(3);
    expect(getLine(result, 0)).toBe('A');
    expect(getLine(result, 1)).toBe('');
    expect(getLine(result, 2)).toBe('B');
  });

  it('deleteRange that removes all content leaves one empty line', () => {
    const doc = createDocument('hello\nworld');
    const result = deleteRange(doc, caret(0, 0), caret(1, 5));
    expect(lineCount(result)).toBe(1);
    expect(getLine(result, 0)).toBe('');
  });

  it('multiple replaces in one transaction', () => {
    const doc = createDocument('aaa bbb ccc');
    const result = applyTransaction(doc, {
      changes: [
        // Replace 'aaa' with 'xxx'
        { from: caret(0, 0), to: caret(0, 3), insert: 'xxx' },
        // After first replace: 'xxx bbb ccc'
        // Replace 'bbb' (now at col 4-7) with 'yyy'
        { from: caret(0, 4), to: caret(0, 7), insert: 'yyy' },
      ],
    });
    expect(getLine(result, 0)).toBe('xxx yyy ccc');
  });
});

// ---------------------------------------------------------------------------
// Caret motion: edge cases
// ---------------------------------------------------------------------------

describe('caret motion edge cases', () => {
  it('moveCaretRight on single-line empty doc stays put', () => {
    const doc = createDocument('');
    expect(moveCaretRight(doc, caret(0, 0))).toEqual(caret(0, 0));
  });

  it('moveCaretLeft on single-line empty doc stays put', () => {
    const doc = createDocument('');
    expect(moveCaretLeft(doc, caret(0, 0))).toEqual(caret(0, 0));
  });

  it('moveCaretUp on single-line doc stays put', () => {
    const doc = createDocument('hello');
    expect(moveCaretUp(doc, caret(0, 3))).toEqual(caret(0, 3));
  });

  it('moveCaretDown on single-line doc stays put', () => {
    const doc = createDocument('hello');
    expect(moveCaretDown(doc, caret(0, 3))).toEqual(caret(0, 3));
  });

  it('moveWordLeft at line 0, column 0 stays put', () => {
    const doc = createDocument('hello');
    expect(moveWordLeft(doc, caret(0, 0))).toEqual(caret(0, 0));
  });

  it('moveWordRight at end of last line stays put', () => {
    const doc = createDocument('hello');
    expect(moveWordRight(doc, caret(0, 5))).toEqual(caret(0, 5));
  });

  it('moveWordRight on empty line wraps to next line', () => {
    const doc = createDocument('hello\n\nworld');
    expect(moveWordRight(doc, caret(1, 0))).toEqual(caret(2, 0));
  });

  it('moveWordLeft on empty line wraps to previous line end', () => {
    const doc = createDocument('hello\n\nworld');
    expect(moveWordLeft(doc, caret(1, 0))).toEqual(caret(0, 5));
  });

  it('moveWordRight handles punctuation', () => {
    const doc = createDocument('foo.bar');
    // At col 0 ("f"), skip word "foo", stop at "." (non-word)
    const pos = moveWordRight(doc, caret(0, 0));
    expect(pos).toEqual(caret(0, 3));
  });

  it('moveWordLeft handles punctuation', () => {
    const doc = createDocument('foo.bar');
    // At col 7 (end), skip "bar" (word), skip "." (non-word), stop at boundary of "foo"
    const pos = moveWordLeft(doc, caret(0, 7));
    expect(pos).toEqual(caret(0, 4));
  });

  it('selectWord on empty line returns zero-width range', () => {
    const doc = createDocument('');
    const range = selectWord(doc, caret(0, 0));
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 0));
  });

  it('selectWord on whitespace returns zero-width range', () => {
    const doc = createDocument('hello   world');
    const range = selectWord(doc, caret(0, 6)); // middle of whitespace
    expect(range.anchor).toEqual(caret(0, 6));
    expect(range.head).toEqual(caret(0, 6));
  });

  it('selectLine on empty line returns zero-width range', () => {
    const doc = createDocument('');
    const range = selectLine(doc, caret(0, 0));
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 0));
  });

  it('selectAll on empty doc returns zero-width range', () => {
    const doc = createDocument('');
    const range = selectAll(doc);
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 0));
  });

  it('moveLineStart already at column 0 stays put', () => {
    const doc = createDocument('hello');
    expect(moveLineStart(doc, caret(0, 0))).toEqual(caret(0, 0));
  });

  it('moveLineEnd already at end stays put', () => {
    const doc = createDocument('hello');
    expect(moveLineEnd(doc, caret(0, 5))).toEqual(caret(0, 5));
  });

  it('moveDocEnd on empty doc returns 0,0', () => {
    const doc = createDocument('');
    expect(moveDocEnd(doc, caret(0, 0))).toEqual(caret(0, 0));
  });
});

// ---------------------------------------------------------------------------
// Immutability guarantees
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('insertText does not share line objects with original', () => {
    const doc = createDocument('hello');
    const result = insertText(doc, caret(0, 5), ' world');
    // Modify nothing — just verify they're different objects
    expect(result.lines[0]).not.toBe(doc.lines[0]);
  });

  it('deleteRange does not share line objects with original', () => {
    const doc = createDocument('hello world');
    const result = deleteRange(doc, caret(0, 5), caret(0, 11));
    expect(result.lines[0]).not.toBe(doc.lines[0]);
  });

  it('multiple operations produce independent documents', () => {
    const doc = createDocument('abc');
    const a = insertText(doc, caret(0, 1), 'X');
    const b = insertText(doc, caret(0, 2), 'Y');
    expect(getLine(a, 0)).toBe('aXbc');
    expect(getLine(b, 0)).toBe('abYc');
    expect(getLine(doc, 0)).toBe('abc');
  });
});
