// ---------------------------------------------------------------------------
// ShipCode — Document Model
// ---------------------------------------------------------------------------
//
// A document is an immutable value over a persistent line tree (`line-tree.ts`): reading a line, mapping between
// lines and flat offsets, and every edit are O(log n), and an edit shares every part of the tree it did not touch
// with the previous version. The tree is private: read through `getLine` / `getLines` / `lineCount` / `lineStart`
// / `lineAtOffset`, edit through `spliceLines` or the change helpers below.

import { CaretPosition } from './selection';
import { cachedText } from './text-cache';
import { buildTree, charsBefore, lineAt, lineAtOffset as treeLineAtOffset, sliceLines, spliceTree, treeText } from './line-tree';
import { treeOf, wrapTree } from './document-internal';

declare const documentBrand: unique symbol;

/** An immutable document. Opaque: use the functions in this module to read and edit it. */
export interface CodeDocument {
  readonly [documentBrand]: true;
}

const wrap = wrapTree;
const rootOf = treeOf;

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
// Reading
// ---------------------------------------------------------------------------

/** Create a document from a string. Empty string creates a single empty line. Normalizes \r\n to \n. */
export function createDocument(text: string): CodeDocument {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return wrap(buildTree(normalized.split('\n')));
}

/** A document from lines (no newline inside any of them). */
export function documentFromLines(lines: readonly string[]): CodeDocument {
  return wrap(buildTree(lines));
}

/** Get the text of a single line. */
export function getLine(doc: CodeDocument, lineIndex: number): string {
  return lineAt(rootOf(doc), lineIndex);
}

/** Lines [from, to) as an array. */
export function getLines(doc: CodeDocument, from = 0, to = lineCount(doc)): string[] {
  return sliceLines(rootOf(doc), Math.max(0, from), Math.min(lineCount(doc), to));
}

/** Get the total number of lines. */
export function lineCount(doc: CodeDocument): number {
  return rootOf(doc).lineCount;
}

/** Total flat length: every character plus one slot per newline. */
export function docSize(doc: CodeDocument): number {
  const root = rootOf(doc);
  return root.chars + root.lineCount - 1;
}

/** Flat offset of `line`'s first character. */
export function lineStart(doc: CodeDocument, line: number): number {
  return charsBefore(rootOf(doc), line) + line;
}

/** The line containing flat offset `pos`, and that line's flat start. */
export function lineAtOffset(doc: CodeDocument, pos: number): { line: number; start: number } {
  return treeLineAtOffset(rootOf(doc), pos);
}

/** Reconstruct the full text from the document (cached per document). */
export function getText(doc: CodeDocument): string {
  return cachedText(doc, () => treeText(rootOf(doc)));
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

/** Replace `deleteCount` lines at `start` with `lines`. A document always keeps at least one line. */
export function spliceLines(doc: CodeDocument, start: number, deleteCount: number, lines: readonly string[]): CodeDocument {
  const root = rootOf(doc);
  const next = spliceTree(root, start, deleteCount, lines);
  return next === root ? doc : wrap(next);
}

/**
 * Replace the text between two points with `text` (which may contain newlines). The lines the range touches are
 * rewritten as one splice; everything else is shared with `doc`.
 */
export function replaceRange(doc: CodeDocument, from: CaretPosition, to: CaretPosition, text: string): CodeDocument {
  const first = getLine(doc, from.line);
  const last = from.line === to.line ? first : getLine(doc, to.line);
  const merged = first.slice(0, from.column) + text + last.slice(to.column);
  return spliceLines(doc, from.line, to.line - from.line + 1, merged.split('\n'));
}

/** Insert text at a position. Supports multi-line inserts (text containing '\n'). */
export function insertText(doc: CodeDocument, pos: CaretPosition, text: string): CodeDocument {
  return replaceRange(doc, pos, pos, text);
}

/**
 * Delete the range [from, to). Within one line it removes characters; across lines it merges the prefix of the
 * `from` line with the suffix of the `to` line.
 */
export function deleteRange(doc: CodeDocument, from: CaretPosition, to: CaretPosition): CodeDocument {
  return replaceRange(doc, from, to, '');
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
