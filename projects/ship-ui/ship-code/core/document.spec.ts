import { describe, it, expect } from 'vitest';
import {
  createDocument,
  getLine,
  lineCount,
  getText,
  insertText,
  deleteRange,
  applyTransaction,
} from './document';

// ---------------------------------------------------------------------------
// createDocument / getLine / getText
// ---------------------------------------------------------------------------

describe('createDocument', () => {
  it('should create a single empty line from empty string', () => {
    const doc = createDocument('');
    expect(lineCount(doc)).toBe(1);
    expect(getLine(doc, 0)).toBe('');
  });

  it('should create multiple lines from multi-line string', () => {
    const doc = createDocument('hello\nworld\nfoo');
    expect(lineCount(doc)).toBe(3);
    expect(getLine(doc, 0)).toBe('hello');
    expect(getLine(doc, 1)).toBe('world');
    expect(getLine(doc, 2)).toBe('foo');
  });

  it('should handle trailing newline', () => {
    const doc = createDocument('hello\n');
    expect(lineCount(doc)).toBe(2);
    expect(getLine(doc, 0)).toBe('hello');
    expect(getLine(doc, 1)).toBe('');
  });
});

describe('getText', () => {
  it('should reconstruct the original text', () => {
    const text = 'hello\nworld\nfoo';
    const doc = createDocument(text);
    expect(getText(doc)).toBe(text);
  });

  it('should handle single line', () => {
    const doc = createDocument('hello');
    expect(getText(doc)).toBe('hello');
  });

  it('should handle empty document', () => {
    const doc = createDocument('');
    expect(getText(doc)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// insertText
// ---------------------------------------------------------------------------

describe('insertText', () => {
  it('should insert text in the middle of a line', () => {
    const doc = createDocument('hello world');
    const result = insertText(doc, { line: 0, column: 5 }, ' beautiful');
    expect(getLine(result, 0)).toBe('hello beautiful world');
  });

  it('should insert at the beginning of a line', () => {
    const doc = createDocument('world');
    const result = insertText(doc, { line: 0, column: 0 }, 'hello ');
    expect(getLine(result, 0)).toBe('hello world');
  });

  it('should insert at the end of a line', () => {
    const doc = createDocument('hello');
    const result = insertText(doc, { line: 0, column: 5 }, ' world');
    expect(getLine(result, 0)).toBe('hello world');
  });

  it('should split line when inserting newline', () => {
    const doc = createDocument('helloworld');
    const result = insertText(doc, { line: 0, column: 5 }, '\n');
    expect(lineCount(result)).toBe(2);
    expect(getLine(result, 0)).toBe('hello');
    expect(getLine(result, 1)).toBe('world');
  });

  it('should handle multi-line insert', () => {
    const doc = createDocument('AD');
    const result = insertText(doc, { line: 0, column: 1 }, 'B\nC\n');
    expect(lineCount(result)).toBe(3);
    expect(getLine(result, 0)).toBe('AB');
    expect(getLine(result, 1)).toBe('C');
    expect(getLine(result, 2)).toBe('D');
  });

  it('should insert on a specific line in multi-line doc', () => {
    const doc = createDocument('line1\nline2\nline3');
    const result = insertText(doc, { line: 1, column: 4 }, 'X');
    expect(getLine(result, 1)).toBe('lineX2');
    expect(lineCount(result)).toBe(3);
  });

  it('should not mutate the original document', () => {
    const doc = createDocument('hello');
    insertText(doc, { line: 0, column: 5 }, ' world');
    expect(getLine(doc, 0)).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// deleteRange
// ---------------------------------------------------------------------------

describe('deleteRange', () => {
  it('should delete characters within a single line', () => {
    const doc = createDocument('hello world');
    const result = deleteRange(doc, { line: 0, column: 5 }, { line: 0, column: 11 });
    expect(getLine(result, 0)).toBe('hello');
  });

  it('should delete range spanning multiple lines', () => {
    const doc = createDocument('hello\nbeautiful\nworld');
    const result = deleteRange(doc, { line: 0, column: 5 }, { line: 2, column: 0 });
    expect(lineCount(result)).toBe(1);
    expect(getLine(result, 0)).toBe('helloworld');
  });

  it('should merge lines when deleting at beginning of line', () => {
    const doc = createDocument('hello\nworld');
    const result = deleteRange(doc, { line: 0, column: 5 }, { line: 1, column: 0 });
    expect(lineCount(result)).toBe(1);
    expect(getLine(result, 0)).toBe('helloworld');
  });

  it('should delete a single character', () => {
    const doc = createDocument('hello');
    const result = deleteRange(doc, { line: 0, column: 1 }, { line: 0, column: 2 });
    expect(getLine(result, 0)).toBe('hllo');
  });

  it('should delete an entire middle line', () => {
    const doc = createDocument('line1\nline2\nline3');
    const result = deleteRange(doc, { line: 0, column: 5 }, { line: 1, column: 5 });
    expect(lineCount(result)).toBe(2);
    expect(getLine(result, 0)).toBe('line1');
    expect(getLine(result, 1)).toBe('line3');
  });

  it('should not mutate the original document', () => {
    const doc = createDocument('hello world');
    deleteRange(doc, { line: 0, column: 5 }, { line: 0, column: 11 });
    expect(getLine(doc, 0)).toBe('hello world');
  });
});

// ---------------------------------------------------------------------------
// applyTransaction
// ---------------------------------------------------------------------------

describe('applyTransaction', () => {
  it('should apply a single insert change', () => {
    const doc = createDocument('hello world');
    const result = applyTransaction(doc, {
      changes: [{ from: { line: 0, column: 5 }, to: { line: 0, column: 5 }, insert: ' beautiful' }],
    });
    expect(getLine(result, 0)).toBe('hello beautiful world');
  });

  it('should apply a single delete change', () => {
    const doc = createDocument('hello world');
    const result = applyTransaction(doc, {
      changes: [{ from: { line: 0, column: 5 }, to: { line: 0, column: 11 }, insert: '' }],
    });
    expect(getLine(result, 0)).toBe('hello');
  });

  it('should apply a replace change (delete + insert)', () => {
    const doc = createDocument('hello world');
    const result = applyTransaction(doc, {
      changes: [{ from: { line: 0, column: 6 }, to: { line: 0, column: 11 }, insert: 'there' }],
    });
    expect(getLine(result, 0)).toBe('hello there');
  });

  it('should apply multiple changes in order', () => {
    const doc = createDocument('abc');
    const result = applyTransaction(doc, {
      changes: [
        // First insert 'X' at col 1 → 'aXbc'
        { from: { line: 0, column: 1 }, to: { line: 0, column: 1 }, insert: 'X' },
        // Then insert 'Y' at col 3 (which is after 'aXb') → 'aXbYc'
        { from: { line: 0, column: 3 }, to: { line: 0, column: 3 }, insert: 'Y' },
      ],
    });
    expect(getLine(result, 0)).toBe('aXbYc');
  });

  it('should handle newline insert in transaction', () => {
    const doc = createDocument('helloworld');
    const result = applyTransaction(doc, {
      changes: [{ from: { line: 0, column: 5 }, to: { line: 0, column: 5 }, insert: '\n' }],
    });
    expect(lineCount(result)).toBe(2);
    expect(getLine(result, 0)).toBe('hello');
    expect(getLine(result, 1)).toBe('world');
  });
});
