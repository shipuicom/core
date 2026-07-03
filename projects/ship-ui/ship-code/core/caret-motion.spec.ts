import { describe, it, expect } from 'vitest';
import {
  caret,
  collapsedSelection,
  selection,
  isCollapsed,
  primaryRange,
  primaryCaret,
} from './selection';
import { createDocument } from './document';
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
} from './caret-motion';

// ---------------------------------------------------------------------------
// Single caret movement
// ---------------------------------------------------------------------------

describe('moveCaretRight', () => {
  const doc = createDocument('hello\nworld');

  it('should move right within a line', () => {
    const pos = moveCaretRight(doc, caret(0, 2));
    expect(pos).toEqual(caret(0, 3));
  });

  it('should wrap to next line at end of line', () => {
    const pos = moveCaretRight(doc, caret(0, 5));
    expect(pos).toEqual(caret(1, 0));
  });

  it('should stay put at end of document', () => {
    const pos = moveCaretRight(doc, caret(1, 5));
    expect(pos).toEqual(caret(1, 5));
  });
});

describe('moveCaretLeft', () => {
  const doc = createDocument('hello\nworld');

  it('should move left within a line', () => {
    const pos = moveCaretLeft(doc, caret(0, 3));
    expect(pos).toEqual(caret(0, 2));
  });

  it('should wrap to previous line at beginning of line', () => {
    const pos = moveCaretLeft(doc, caret(1, 0));
    expect(pos).toEqual(caret(0, 5));
  });

  it('should stay put at beginning of document', () => {
    const pos = moveCaretLeft(doc, caret(0, 0));
    expect(pos).toEqual(caret(0, 0));
  });
});

describe('moveCaretUp', () => {
  const doc = createDocument('hello\nworld\nfoo');

  it('should move to the same column on the previous line', () => {
    const pos = moveCaretUp(doc, caret(1, 3));
    expect(pos).toEqual(caret(0, 3));
  });

  it('should clamp column if previous line is shorter', () => {
    const doc2 = createDocument('hi\nhello');
    const pos = moveCaretUp(doc2, caret(1, 4));
    expect(pos).toEqual(caret(0, 2)); // 'hi' only has 2 chars
  });

  it('should stay at first line', () => {
    const pos = moveCaretUp(doc, caret(0, 3));
    expect(pos).toEqual(caret(0, 3));
  });
});

describe('moveCaretDown', () => {
  const doc = createDocument('hello\nworld\nfoo');

  it('should move to the same column on the next line', () => {
    const pos = moveCaretDown(doc, caret(0, 3));
    expect(pos).toEqual(caret(1, 3));
  });

  it('should clamp column if next line is shorter', () => {
    const doc2 = createDocument('hello\nhi');
    const pos = moveCaretDown(doc2, caret(0, 4));
    expect(pos).toEqual(caret(1, 2)); // 'hi' only has 2 chars
  });

  it('should stay at last line', () => {
    const pos = moveCaretDown(doc, caret(2, 2));
    expect(pos).toEqual(caret(2, 2));
  });
});

// ---------------------------------------------------------------------------
// Word movement
// ---------------------------------------------------------------------------

describe('moveWordLeft', () => {
  it('should jump to the beginning of current word', () => {
    const doc = createDocument('hello world');
    const pos = moveWordLeft(doc, caret(0, 8));
    expect(pos).toEqual(caret(0, 6));
  });

  it('should jump past whitespace to previous word', () => {
    const doc = createDocument('hello world');
    const pos = moveWordLeft(doc, caret(0, 6));
    expect(pos).toEqual(caret(0, 0));
  });

  it('should go to beginning of line', () => {
    const doc = createDocument('hello');
    const pos = moveWordLeft(doc, caret(0, 3));
    expect(pos).toEqual(caret(0, 0));
  });

  it('should wrap to end of previous line', () => {
    const doc = createDocument('hello\nworld');
    const pos = moveWordLeft(doc, caret(1, 0));
    expect(pos).toEqual(caret(0, 5));
  });
});

describe('moveWordRight', () => {
  it('should jump to the end of current word', () => {
    const doc = createDocument('hello world');
    const pos = moveWordRight(doc, caret(0, 2));
    expect(pos).toEqual(caret(0, 5));
  });

  it('should jump past whitespace to next word', () => {
    const doc = createDocument('hello world');
    const pos = moveWordRight(doc, caret(0, 5));
    expect(pos).toEqual(caret(0, 11));
  });

  it('should go to end of line', () => {
    const doc = createDocument('hello');
    const pos = moveWordRight(doc, caret(0, 3));
    expect(pos).toEqual(caret(0, 5));
  });

  it('should wrap to beginning of next line', () => {
    const doc = createDocument('hello\nworld');
    const pos = moveWordRight(doc, caret(0, 5));
    expect(pos).toEqual(caret(1, 0));
  });
});

// ---------------------------------------------------------------------------
// Line/document-level movement
// ---------------------------------------------------------------------------

describe('moveLineStart', () => {
  it('should move to column 0', () => {
    const doc = createDocument('hello');
    expect(moveLineStart(doc, caret(0, 3))).toEqual(caret(0, 0));
  });
});

describe('moveLineEnd', () => {
  it('should move to end of line', () => {
    const doc = createDocument('hello\nworld');
    expect(moveLineEnd(doc, caret(0, 2))).toEqual(caret(0, 5));
  });
});

describe('moveDocStart', () => {
  it('should move to line 0, column 0', () => {
    const doc = createDocument('hello\nworld\nfoo');
    expect(moveDocStart(doc, caret(2, 3))).toEqual(caret(0, 0));
  });
});

describe('moveDocEnd', () => {
  it('should move to last line, last column', () => {
    const doc = createDocument('hello\nworld\nfoo');
    expect(moveDocEnd(doc, caret(0, 0))).toEqual(caret(2, 3));
  });
});

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

describe('selectWord', () => {
  it('should select the word under the caret', () => {
    const doc = createDocument('hello world');
    const range = selectWord(doc, caret(0, 7));
    expect(range.anchor).toEqual(caret(0, 6));
    expect(range.head).toEqual(caret(0, 11));
  });

  it('should select word at the beginning', () => {
    const doc = createDocument('hello world');
    const range = selectWord(doc, caret(0, 2));
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 5));
  });
});

describe('selectLine', () => {
  it('should select the entire current line', () => {
    const doc = createDocument('hello\nworld\nfoo');
    const range = selectLine(doc, caret(1, 2));
    expect(range.anchor).toEqual(caret(1, 0));
    expect(range.head).toEqual(caret(1, 5));
  });
});

describe('selectAll', () => {
  it('should select from document start to document end', () => {
    const doc = createDocument('hello\nworld\nfoo');
    const range = selectAll(doc);
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(2, 3));
  });
});
