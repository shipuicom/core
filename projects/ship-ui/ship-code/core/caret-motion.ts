// ---------------------------------------------------------------------------
// ShipCode — Caret Motion Functions
// ---------------------------------------------------------------------------

import { CaretPosition, SelectionRange, caret } from './selection';
import { CodeDocument, getLine, lineCount } from './document';

// ---------------------------------------------------------------------------
// Character-level movement
// ---------------------------------------------------------------------------

/** Move caret one character to the right, wrapping to next line at EOL. */
export function moveCaretRight(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  const lineLen = getLine(doc, pos.line).length;

  if (pos.column < lineLen) {
    return caret(pos.line, pos.column + 1);
  }

  // At end of line — wrap to next line
  if (pos.line < lineCount(doc) - 1) {
    return caret(pos.line + 1, 0);
  }

  // At end of document — stay put
  return pos;
}

/** Move caret one character to the left, wrapping to previous line at BOL. */
export function moveCaretLeft(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  if (pos.column > 0) {
    return caret(pos.line, pos.column - 1);
  }

  // At beginning of line — wrap to end of previous line
  if (pos.line > 0) {
    return caret(pos.line - 1, getLine(doc, pos.line - 1).length);
  }

  // At beginning of document — stay put
  return pos;
}

/** Move caret one line up, clamping column to line length. */
export function moveCaretUp(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  if (pos.line === 0) return pos;

  const prevLineLen = getLine(doc, pos.line - 1).length;
  return caret(pos.line - 1, Math.min(pos.column, prevLineLen));
}

/** Move caret one line down, clamping column to line length. */
export function moveCaretDown(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  if (pos.line >= lineCount(doc) - 1) return pos;

  const nextLineLen = getLine(doc, pos.line + 1).length;
  return caret(pos.line + 1, Math.min(pos.column, nextLineLen));
}

// ---------------------------------------------------------------------------
// Word-level movement
// ---------------------------------------------------------------------------

/** Is a character a "word" character (not whitespace or punctuation)? */
function isWordChar(ch: string): boolean {
  return /\w/.test(ch);
}

/** Move caret to the beginning of the current/previous word. */
export function moveWordLeft(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  const line = getLine(doc, pos.line);

  // At beginning of line — wrap to end of previous line
  if (pos.column === 0) {
    if (pos.line > 0) {
      return caret(pos.line - 1, getLine(doc, pos.line - 1).length);
    }
    return pos;
  }

  let col = pos.column;

  // Skip any whitespace/non-word characters to the left
  while (col > 0 && !isWordChar(line[col - 1])) {
    col--;
  }

  // Then skip word characters to the left
  while (col > 0 && isWordChar(line[col - 1])) {
    col--;
  }

  return caret(pos.line, col);
}

/** Move caret to the end of the current/next word. */
export function moveWordRight(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  const line = getLine(doc, pos.line);
  const len = line.length;

  // At end of line — wrap to beginning of next line
  if (pos.column >= len) {
    if (pos.line < lineCount(doc) - 1) {
      return caret(pos.line + 1, 0);
    }
    return pos;
  }

  let col = pos.column;

  if (isWordChar(line[col])) {
    // Inside a word — skip to end of word
    while (col < len && isWordChar(line[col])) {
      col++;
    }
  } else {
    // On whitespace/punctuation — skip non-word chars, then skip the word
    while (col < len && !isWordChar(line[col])) {
      col++;
    }
    while (col < len && isWordChar(line[col])) {
      col++;
    }
  }

  return caret(pos.line, col);
}

// ---------------------------------------------------------------------------
// Line / document-level movement
// ---------------------------------------------------------------------------

/** Move caret to the beginning of the current line. */
export function moveLineStart(_doc: CodeDocument, pos: CaretPosition): CaretPosition {
  return caret(pos.line, 0);
}

/** Move caret to the end of the current line. */
export function moveLineEnd(doc: CodeDocument, pos: CaretPosition): CaretPosition {
  return caret(pos.line, getLine(doc, pos.line).length);
}

/** Move caret to the beginning of the document. */
export function moveDocStart(_doc: CodeDocument, _pos: CaretPosition): CaretPosition {
  return caret(0, 0);
}

/** Move caret to the end of the document. */
export function moveDocEnd(doc: CodeDocument, _pos: CaretPosition): CaretPosition {
  const lastLine = lineCount(doc) - 1;
  return caret(lastLine, getLine(doc, lastLine).length);
}

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

/** Find the word boundaries around a caret position. Returns a SelectionRange. */
export function selectWord(doc: CodeDocument, pos: CaretPosition): SelectionRange {
  const line = getLine(doc, pos.line);
  let start = pos.column;
  let end = pos.column;

  // Expand left to word boundary
  while (start > 0 && isWordChar(line[start - 1])) {
    start--;
  }

  // Expand right to word boundary
  while (end < line.length && isWordChar(line[end])) {
    end++;
  }

  return { anchor: caret(pos.line, start), head: caret(pos.line, end) };
}

/** Select the entire current line. */
export function selectLine(doc: CodeDocument, pos: CaretPosition): SelectionRange {
  return { anchor: caret(pos.line, 0), head: caret(pos.line, getLine(doc, pos.line).length) };
}

/** Select the entire document. */
export function selectAll(doc: CodeDocument): SelectionRange {
  const lastLine = lineCount(doc) - 1;
  return { anchor: caret(0, 0), head: caret(lastLine, getLine(doc, lastLine).length) };
}
