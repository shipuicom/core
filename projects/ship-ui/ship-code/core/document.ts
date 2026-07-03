// ---------------------------------------------------------------------------
// ShipCode — Document Model
// ---------------------------------------------------------------------------

import { CaretPosition } from './selection';

/**
 * A single line in the document.
 * Holds raw text and cached tokenization data (added later).
 */
export interface CodeLine {
  readonly text: string;
}

/**
 * The full document: an immutable array of lines.
 */
export interface CodeDocument {
  readonly lines: readonly CodeLine[];
}

/**
 * A single change to the document.
 * Deletes characters in [from, to) then inserts `insert` at `from`.
 * For a pure insert: from === to.
 * For a pure delete: insert === ''.
 */
export interface Change {
  readonly from: CaretPosition;
  readonly to: CaretPosition;
  readonly insert: string;
}

/**
 * A transaction groups one or more changes into an atomic operation.
 */
export interface Transaction {
  readonly changes: readonly Change[];
}

// ---------------------------------------------------------------------------
// Document operations
// ---------------------------------------------------------------------------

/** Create a document from a string. Empty string creates a single empty line. Normalizes \r\n to \n. */
export function createDocument(text: string): CodeDocument {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  return { lines: rawLines.map((t) => ({ text: t })) };
}

/** Get the text of a single line. */
export function getLine(doc: CodeDocument, lineIndex: number): string {
  return doc.lines[lineIndex].text;
}

/** Get the total number of lines. */
export function lineCount(doc: CodeDocument): number {
  return doc.lines.length;
}

/** Reconstruct the full text from the document. */
export function getText(doc: CodeDocument): string {
  return doc.lines.map((l) => l.text).join('\n');
}

/**
 * Insert text at a position. Supports multi-line inserts (text containing '\n').
 * Returns a new document with structural sharing — unchanged lines keep
 * the same object identity for downstream skip checks.
 */
export function insertText(doc: CodeDocument, pos: CaretPosition, text: string): CodeDocument {
  const line = doc.lines[pos.line].text;
  const before = line.slice(0, pos.column);
  const after = line.slice(pos.column);
  const insertedLines = text.split('\n');

  if (insertedLines.length === 1) {
    // Single-line insert: only one CodeLine changes
    const newLines: CodeLine[] = new Array(doc.lines.length);
    for (let i = 0; i < doc.lines.length; i++) {
      newLines[i] = i === pos.line
        ? { text: before + insertedLines[0] + after }
        : doc.lines[i]; // structural sharing
    }
    return { lines: newLines };
  }

  // Multi-line insert: split into prefix lines, new middle lines, suffix lines
  const newCodeLines: CodeLine[] = [
    { text: before + insertedLines[0] },
    ...insertedLines.slice(1, -1).map((t) => ({ text: t })),
    { text: insertedLines[insertedLines.length - 1] + after },
  ];

  // [0..pos.line) + newCodeLines + [pos.line+1..end)
  const result: CodeLine[] = new Array(doc.lines.length - 1 + newCodeLines.length);
  let idx = 0;
  for (let i = 0; i < pos.line; i++) result[idx++] = doc.lines[i]; // shared
  for (const cl of newCodeLines) result[idx++] = cl;                // new
  for (let i = pos.line + 1; i < doc.lines.length; i++) result[idx++] = doc.lines[i]; // shared

  return { lines: result };
}

/**
 * Delete the range [from, to). Returns a new document with structural sharing.
 * If from and to are on the same line, removes characters in that range.
 * If they span multiple lines, merges the prefix of `from` line with the suffix of `to` line.
 */
export function deleteRange(doc: CodeDocument, from: CaretPosition, to: CaretPosition): CodeDocument {
  if (from.line === to.line) {
    // Same line: only one CodeLine changes
    const line = doc.lines[from.line].text;
    const newText = line.slice(0, from.column) + line.slice(to.column);
    const result: CodeLine[] = new Array(doc.lines.length);
    for (let i = 0; i < doc.lines.length; i++) {
      result[i] = i === from.line ? { text: newText } : doc.lines[i]; // structural sharing
    }
    return { lines: result };
  }

  // Multi-line: merge first and last, remove middle
  const mergedText = doc.lines[from.line].text.slice(0, from.column)
    + doc.lines[to.line].text.slice(to.column);

  // [0..from.line) + merged + [to.line+1..end)
  const deletedCount = to.line - from.line; // lines removed (net: deletedCount lines gone)
  const result: CodeLine[] = new Array(doc.lines.length - deletedCount);
  let idx = 0;
  for (let i = 0; i < from.line; i++) result[idx++] = doc.lines[i];       // shared
  result[idx++] = { text: mergedText };                                     // new (merged)
  for (let i = to.line + 1; i < doc.lines.length; i++) result[idx++] = doc.lines[i]; // shared

  return { lines: result };
}

/**
 * Apply a transaction (one or more changes) to a document.
 * Changes are applied in order. Each change operates on the document
 * as modified by all previous changes.
 */
export function applyTransaction(doc: CodeDocument, tx: Transaction): CodeDocument {
  let result = doc;
  for (const change of tx.changes) {
    if (change.insert && (change.from.line !== change.to.line || change.from.column !== change.to.column)) {
      // Replace: delete then insert
      result = deleteRange(result, change.from, change.to);
      result = insertText(result, change.from, change.insert);
    } else if (change.insert) {
      // Pure insert
      result = insertText(result, change.from, change.insert);
    } else {
      // Pure delete
      result = deleteRange(result, change.from, change.to);
    }
  }
  return result;
}
