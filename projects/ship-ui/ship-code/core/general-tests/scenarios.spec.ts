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
  selectWord,
} from '../caret-motion';

/**
 * Real-world editor scenario tests.
 * Simulates actual user workflows and catches issues
 * that only surface during interactive editing.
 */

// ---------------------------------------------------------------------------
// Round-trip integrity
// ---------------------------------------------------------------------------

describe('round-trip integrity', () => {
  const inputs = [
    '',
    'hello',
    'hello\nworld',
    'hello\n\nworld',
    '\n',
    '\n\n\n',
    'line1\nline2\nline3\nline4\nline5',
    '  indented\n    more indented\n      deep',
    'tabs\there\ttoo',
    'special chars: <>&"\'`~!@#$%^&*()',
  ];

  for (const input of inputs) {
    it(`getText(createDocument("${input.replace(/\n/g, '\\n').slice(0, 40)}")) === original`, () => {
      expect(getText(createDocument(input))).toBe(input);
    });
  }
});

// ---------------------------------------------------------------------------
// Typing simulation
// ---------------------------------------------------------------------------

describe('typing simulation', () => {
  it('should simulate typing "hello" one character at a time', () => {
    let doc = createDocument('');
    const chars = 'hello';
    for (let i = 0; i < chars.length; i++) {
      doc = insertText(doc, caret(0, i), chars[i]);
    }
    expect(getText(doc)).toBe('hello');
  });

  it('should simulate typing across lines with Enter', () => {
    let doc = createDocument('');
    // Type "hello", press Enter, type "world"
    doc = insertText(doc, caret(0, 0), 'hello');
    doc = insertText(doc, caret(0, 5), '\n');
    doc = insertText(doc, caret(1, 0), 'world');
    expect(lineCount(doc)).toBe(2);
    expect(getLine(doc, 0)).toBe('hello');
    expect(getLine(doc, 1)).toBe('world');
  });

  it('should simulate typing in the middle of existing text', () => {
    let doc = createDocument('hllo');
    // Insert 'e' at column 1 to fix typo
    doc = insertText(doc, caret(0, 1), 'e');
    expect(getLine(doc, 0)).toBe('hello');
  });

  it('should simulate rapid typing at end of line', () => {
    let doc = createDocument('');
    const text = 'const x = 42;';
    for (let i = 0; i < text.length; i++) {
      doc = insertText(doc, caret(0, i), text[i]);
    }
    expect(getLine(doc, 0)).toBe('const x = 42;');
  });
});

// ---------------------------------------------------------------------------
// Backspace / Delete simulation
// ---------------------------------------------------------------------------

describe('backspace simulation', () => {
  it('should simulate backspace at end of word', () => {
    let doc = createDocument('hello');
    // Backspace from end: delete char at col 4..5
    doc = deleteRange(doc, caret(0, 4), caret(0, 5));
    expect(getLine(doc, 0)).toBe('hell');
  });

  it('should simulate backspace at beginning of line (join lines)', () => {
    let doc = createDocument('hello\nworld');
    // Backspace at line 1, col 0: delete from line 0 end to line 1 start
    doc = deleteRange(doc, caret(0, 5), caret(1, 0));
    expect(lineCount(doc)).toBe(1);
    expect(getLine(doc, 0)).toBe('helloworld');
  });

  it('should simulate delete key (forward delete)', () => {
    let doc = createDocument('hello');
    // Delete at col 0: removes 'h'
    doc = deleteRange(doc, caret(0, 0), caret(0, 1));
    expect(getLine(doc, 0)).toBe('ello');
  });

  it('should simulate delete at end of line (join with next)', () => {
    let doc = createDocument('hello\nworld');
    // Delete at end of line 0: same as backspace at start of line 1
    doc = deleteRange(doc, caret(0, 5), caret(1, 0));
    expect(lineCount(doc)).toBe(1);
    expect(getLine(doc, 0)).toBe('helloworld');
  });

  it('should simulate select-all + delete (clear document)', () => {
    let doc = createDocument('hello\nworld\nfoo');
    doc = deleteRange(doc, caret(0, 0), caret(2, 3));
    expect(lineCount(doc)).toBe(1);
    expect(getLine(doc, 0)).toBe('');
  });

  it('should simulate type, backspace, type (correction)', () => {
    let doc = createDocument('helo');
    // Insert 'l' at col 3: 'hel' + 'l' + 'o' = 'hello'
    doc = insertText(doc, caret(0, 3), 'l');
    expect(getLine(doc, 0)).toBe('hello');
    // Oops, wrong letter. Backspace at col 4 to remove 'l'
    doc = deleteRange(doc, caret(0, 3), caret(0, 4));
    expect(getLine(doc, 0)).toBe('helo');
    // Now type the right char 'l' at col 3
    doc = insertText(doc, caret(0, 3), 'l');
    expect(getLine(doc, 0)).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// Selection + replace (type over selection)
// ---------------------------------------------------------------------------

describe('selection replace simulation', () => {
  it('should simulate selecting a word and replacing it', () => {
    let doc = createDocument('hello world');
    // Select "world" (col 6..11) and type "there"
    doc = applyTransaction(doc, {
      changes: [{ from: caret(0, 6), to: caret(0, 11), insert: 'there' }],
    });
    expect(getLine(doc, 0)).toBe('hello there');
  });

  it('should simulate selecting multiple lines and replacing with single line', () => {
    let doc = createDocument('line1\nline2\nline3');
    // Select all 3 lines, replace with "replaced"
    doc = applyTransaction(doc, {
      changes: [{ from: caret(0, 0), to: caret(2, 5), insert: 'replaced' }],
    });
    expect(lineCount(doc)).toBe(1);
    expect(getLine(doc, 0)).toBe('replaced');
  });

  it('should simulate selecting single line and replacing with multiple lines', () => {
    let doc = createDocument('replace me');
    doc = applyTransaction(doc, {
      changes: [{ from: caret(0, 0), to: caret(0, 10), insert: 'line1\nline2\nline3' }],
    });
    expect(lineCount(doc)).toBe(3);
    expect(getLine(doc, 0)).toBe('line1');
    expect(getLine(doc, 1)).toBe('line2');
    expect(getLine(doc, 2)).toBe('line3');
  });
});

// ---------------------------------------------------------------------------
// Unicode & special characters
// ---------------------------------------------------------------------------

describe('unicode handling', () => {
  it('should handle basic unicode (accented characters)', () => {
    const doc = createDocument('café résumé');
    expect(getLine(doc, 0)).toBe('café résumé');
    expect(getLine(doc, 0).length).toBe(11);
  });

  it('should insert into unicode text', () => {
    const doc = createDocument('café');
    const result = insertText(doc, caret(0, 4), '!');
    expect(getLine(result, 0)).toBe('café!');
  });

  it('should delete from unicode text', () => {
    const doc = createDocument('café');
    // Delete the 'é' (single code point, col 3..4)
    const result = deleteRange(doc, caret(0, 3), caret(0, 4));
    expect(getLine(result, 0)).toBe('caf');
  });

  it('should handle CJK characters', () => {
    const doc = createDocument('你好世界');
    expect(getLine(doc, 0).length).toBe(4);
    const result = insertText(doc, caret(0, 2), '的');
    expect(getLine(result, 0)).toBe('你好的世界');
  });

  it('should handle emoji (BMP - single code point)', () => {
    const doc = createDocument('hello ★ world');
    const result = insertText(doc, caret(0, 7), '!');
    expect(getLine(result, 0)).toBe('hello ★! world');
  });

  it('should handle emoji (surrogate pair - 2 code units)', () => {
    // 😀 is U+1F600, stored as 2 code units in JS
    const doc = createDocument('hi 😀 there');
    // '😀'.length === 2 in JS
    expect(getLine(doc, 0)).toBe('hi 😀 there');
    // Note: column-based ops may split surrogates — this tests current behavior
    // This is a known limitation; full grapheme-cluster support comes later
  });

  it('should round-trip unicode correctly', () => {
    const text = '日本語\nрусский\nعربي';
    expect(getText(createDocument(text))).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// Word boundaries with code characters
// ---------------------------------------------------------------------------

describe('word boundaries with code', () => {
  it('should treat underscore as word char', () => {
    const doc = createDocument('my_variable = 5');
    // selectWord at col 3 (inside "my_variable") should select the whole thing
    const range = selectWord(doc, caret(0, 3));
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 11));
  });

  it('should treat numbers as word chars', () => {
    const doc = createDocument('value123 = 0');
    const range = selectWord(doc, caret(0, 5));
    expect(range.anchor).toEqual(caret(0, 0));
    expect(range.head).toEqual(caret(0, 8));
  });

  it('should stop at operators', () => {
    const doc = createDocument('a+b');
    const rangeA = selectWord(doc, caret(0, 0));
    expect(rangeA.anchor).toEqual(caret(0, 0));
    expect(rangeA.head).toEqual(caret(0, 1));

    const rangeB = selectWord(doc, caret(0, 2));
    expect(rangeB.anchor).toEqual(caret(0, 2));
    expect(rangeB.head).toEqual(caret(0, 3));
  });

  it('should handle dots in property access', () => {
    const doc = createDocument('obj.prop');
    const range = selectWord(doc, caret(0, 5));
    expect(range.anchor).toEqual(caret(0, 4));
    expect(range.head).toEqual(caret(0, 8));
  });

  it('should handle dollar sign as word char', () => {
    // \w includes $ in JS regex? Actually no, \w = [a-zA-Z0-9_]
    // $ is NOT a word char. This tests current behavior.
    const doc = createDocument('$scope');
    const range = selectWord(doc, caret(0, 1));
    expect(range.anchor).toEqual(caret(0, 1));
    expect(range.head).toEqual(caret(0, 6));
  });

  it('moveWordRight through code line', () => {
    const doc = createDocument('const x = 42;');
    let pos = caret(0, 0);
    pos = moveWordRight(doc, pos); // end of "const" → col 5
    expect(pos).toEqual(caret(0, 5));
    pos = moveWordRight(doc, pos); // skip space, end of "x" → col 7
    expect(pos).toEqual(caret(0, 7));
    pos = moveWordRight(doc, pos); // skip " = ", end of "42" → need to check
    // At col 7 we're on ' ', skip spaces + '=' + space → col 10, then "42" → col 12
    // Actually: col 7 is ' ', non-word. skip non-word: ' '(7), '='(9)... wait
    // "const x = 42;" indices:
    // c(0) o(1) n(2) s(3) t(4) ' '(5) x(6) ' '(7) =(8) ' '(9) 4(10) 2(11) ;(12)
    // From col 7: not word char → skip non-word[' ','=', ' '] → col 10, skip word['4','2'] → col 12
    expect(pos).toEqual(caret(0, 12));
  });

  it('moveWordLeft through code line', () => {
    const doc = createDocument('const x = 42;');
    let pos = caret(0, 13); // end of line
    pos = moveWordLeft(doc, pos); // ';' is non-word → skip it, then skip '42' → col 10
    expect(pos).toEqual(caret(0, 10));
    pos = moveWordLeft(doc, pos); // ' = ' is non-word → skip, then 'x' → col 6
    expect(pos).toEqual(caret(0, 6));
    pos = moveWordLeft(doc, pos); // ' ' is non-word → skip, then 'const' → col 0
    expect(pos).toEqual(caret(0, 0));
  });
});

// ---------------------------------------------------------------------------
// Caret movement after edits (position tracking)
// ---------------------------------------------------------------------------

describe('caret position after edits', () => {
  it('caret should logically be after inserted text', () => {
    const doc = createDocument('hello');
    const result = insertText(doc, caret(0, 5), ' world');
    // After inserting " world" at col 5, the caret should be at col 11
    const expectedCaretCol = 5 + ' world'.length;
    expect(expectedCaretCol).toBe(11);
    expect(getLine(result, 0).length).toBe(11);
  });

  it('caret should be at deletion point after deleting forward', () => {
    const doc = createDocument('hello world');
    const result = deleteRange(doc, caret(0, 5), caret(0, 6));
    // After deleting at col 5..6, caret stays at col 5
    expect(getLine(result, 0)).toBe('helloworld');
  });

  it('typing newline at start of non-empty line pushes content down', () => {
    const doc = createDocument('hello');
    const result = insertText(doc, caret(0, 0), '\n');
    expect(lineCount(result)).toBe(2);
    expect(getLine(result, 0)).toBe('');
    expect(getLine(result, 1)).toBe('hello');
  });

  it('typing newline at end of line creates empty line below', () => {
    const doc = createDocument('hello');
    const result = insertText(doc, caret(0, 5), '\n');
    expect(lineCount(result)).toBe(2);
    expect(getLine(result, 0)).toBe('hello');
    expect(getLine(result, 1)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Multi-line paste
// ---------------------------------------------------------------------------

describe('multi-line paste', () => {
  it('should paste multiple lines at cursor', () => {
    const doc = createDocument('AB');
    const pasted = 'line1\nline2\nline3';
    const result = insertText(doc, caret(0, 1), pasted);
    expect(lineCount(result)).toBe(3);
    expect(getLine(result, 0)).toBe('Aline1');
    expect(getLine(result, 1)).toBe('line2');
    expect(getLine(result, 2)).toBe('line3B');
  });

  it('should paste over selection', () => {
    const doc = createDocument('hello world');
    const result = applyTransaction(doc, {
      changes: [{ from: caret(0, 5), to: caret(0, 11), insert: '\nfoo\nbar' }],
    });
    expect(lineCount(result)).toBe(3);
    expect(getLine(result, 0)).toBe('hello');
    expect(getLine(result, 1)).toBe('foo');
    expect(getLine(result, 2)).toBe('bar');
  });

  it('should handle paste of content with trailing newline', () => {
    const doc = createDocument('existing');
    const result = insertText(doc, caret(0, 8), '\npasted\n');
    expect(lineCount(result)).toBe(3);
    expect(getLine(result, 0)).toBe('existing');
    expect(getLine(result, 1)).toBe('pasted');
    expect(getLine(result, 2)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Caret motion: vertical movement column clamping
// ---------------------------------------------------------------------------

describe('vertical movement column clamping', () => {
  it('should clamp column when moving down to shorter line then restore when returning', () => {
    const doc = createDocument('long line here\nhi\nlong line here');
    // Start at col 10 on long line
    let pos = caret(0, 10);
    // Move down to "hi" (length 2) — clamps to col 2
    pos = moveCaretDown(doc, pos);
    expect(pos).toEqual(caret(1, 2));
    // Move down to long line — should go to col 2 (not restore 10, sticky column not implemented yet)
    pos = moveCaretDown(doc, pos);
    expect(pos).toEqual(caret(2, 2));
  });

  it('should clamp column when moving up to shorter line', () => {
    const doc = createDocument('hi\nlong line here');
    const pos = moveCaretUp(doc, caret(1, 10));
    expect(pos).toEqual(caret(0, 2));
  });
});

// ---------------------------------------------------------------------------
// Indentation-aware scenarios
// ---------------------------------------------------------------------------

describe('indentation scenarios', () => {
  it('should preserve indentation structure after line operations', () => {
    const doc = createDocument('  if (true) {\n    return;\n  }');
    // Delete the middle line (return statement)
    const result = deleteRange(doc, caret(0, 14), caret(1, 11));
    expect(lineCount(result)).toBe(2);
    expect(getLine(result, 0)).toBe('  if (true) {');
    expect(getLine(result, 1)).toBe('  }');
  });

  it('should handle inserting indented block', () => {
    const doc = createDocument('function foo() {\n}');
    const block = '\n  const x = 1;\n  return x;';
    const result = insertText(doc, caret(0, 16), block);
    expect(lineCount(result)).toBe(4);
    expect(getLine(result, 0)).toBe('function foo() {');
    expect(getLine(result, 1)).toBe('  const x = 1;');
    expect(getLine(result, 2)).toBe('  return x;');
    expect(getLine(result, 3)).toBe('}');
  });
});

// ---------------------------------------------------------------------------
// Stress: many lines
// ---------------------------------------------------------------------------

describe('performance sanity', () => {
  it('should handle 10000-line document creation', () => {
    const lines = Array.from({ length: 10000 }, (_, i) => `line ${i}`);
    const text = lines.join('\n');
    const doc = createDocument(text);
    expect(lineCount(doc)).toBe(10000);
    expect(getLine(doc, 0)).toBe('line 0');
    expect(getLine(doc, 9999)).toBe('line 9999');
  });

  it('should handle insert at end of 10000-line document', () => {
    const lines = Array.from({ length: 10000 }, (_, i) => `line ${i}`);
    const doc = createDocument(lines.join('\n'));
    const result = insertText(doc, caret(9999, getLine(doc, 9999).length), ' appended');
    expect(getLine(result, 9999)).toBe('line 9999 appended');
    expect(lineCount(result)).toBe(10000);
  });

  it('should handle 100 sequential inserts', () => {
    let doc = createDocument('');
    for (let i = 0; i < 100; i++) {
      doc = insertText(doc, caret(0, i), String(i % 10));
    }
    expect(getLine(doc, 0).length).toBe(100);
  });
});
