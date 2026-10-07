// ---------------------------------------------------------------------------
// ShipCode — Columnar Line Index
// ---------------------------------------------------------------------------
//
// The flat-position machinery, mirroring ship-editor's columnar model. A flat
// position counts characters with one slot per newline, so `moveRight` is
// `pos + 1` even across line boundaries and a selection is just
// `{anchor, head}` numbers.
//
// The document's line tree caches line and character counts per node, so every
// lookup here is one O(log n) descent: nothing is rebuilt when the document
// changes, and an index is a thin view kept per document value.

import { CodeDocument, docSize, getLine, getLines, lineAtOffset, lineCount, lineStart } from './document';
import { CaretPosition } from './selection';

/** A flat character offset in [0, size]. Newlines occupy one slot each. */
export type FlatPos = number;

export class LineIndex {
  #doc: CodeDocument;
  #size: number;
  #lineCount: number;

  constructor(doc: CodeDocument) {
    this.#doc = doc;
    this.#size = docSize(doc);
    this.#lineCount = lineCount(doc);
  }

  /** Total flat length of the document. Valid positions are [0, size]. */
  get size(): number {
    return this.#size;
  }

  get lineCount(): number {
    return this.#lineCount;
  }

  #clampLine(line: number): number {
    return Math.max(0, Math.min(line, this.#lineCount - 1));
  }

  /** Flat offset of `line`'s first character. */
  startOf(line: number): FlatPos {
    return lineStart(this.#doc, this.#clampLine(line));
  }

  /** Flat offset just past `line`'s last character (before its newline slot). */
  endOf(line: number): FlatPos {
    const clamped = this.#clampLine(line);
    return lineStart(this.#doc, clamped) + getLine(this.#doc, clamped).length;
  }

  /** The line whose span contains flat position `pos`. */
  lineAt(pos: FlatPos): number {
    if (pos <= 0) return 0;
    if (pos >= this.#size) return this.#lineCount - 1;
    return lineAtOffset(this.#doc, pos).line;
  }

  /** Flat position of a line/column point, clamping the column to the line. */
  posOf(point: CaretPosition): FlatPos {
    const line = this.#clampLine(point.line);
    const len = getLine(this.#doc, line).length;
    return lineStart(this.#doc, line) + Math.max(0, Math.min(point.column, len));
  }

  /** Line/column point of a flat position, clamped to [0, size]. */
  pointAt(pos: FlatPos): CaretPosition {
    const clamped = Math.max(0, Math.min(pos, this.#size));
    const { line, start } = lineAtOffset(this.#doc, clamped);
    return { line, column: Math.min(clamped - start, getLine(this.#doc, line).length) };
  }

  /** Document text in [from, to), newlines included. */
  sliceText(from: FlatPos, to: FlatPos): string {
    const a = Math.max(0, Math.min(from, to, this.#size));
    const b = Math.min(this.#size, Math.max(from, to));
    if (a === b) return '';
    const start = this.pointAt(a);
    const end = this.pointAt(b);
    const lines = getLines(this.#doc, start.line, end.line + 1);
    if (lines.length === 1) return lines[0]!.slice(start.column, end.column);
    lines[0] = lines[0]!.slice(start.column);
    lines[lines.length - 1] = lines[lines.length - 1]!.slice(0, end.column);
    return lines.join('\n');
  }
}

const CACHE = new WeakMap<CodeDocument, LineIndex>();

/** The (cached) index view for a document value. */
export function indexFor(doc: CodeDocument): LineIndex {
  let index = CACHE.get(doc);
  if (!index) {
    index = new LineIndex(doc);
    CACHE.set(doc, index);
  }
  return index;
}

// ---------------------------------------------------------------------------
// Flat changes: the transaction currency of the flat model.
// ---------------------------------------------------------------------------

/** Delete [from, to), insert `insert` at `from` — all flat offsets. */
export interface FlatChange {
  readonly from: FlatPos;
  readonly to: FlatPos;
  readonly insert: string;
}

/**
 * Map a flat position through a change, association-right: a position at the
 * change site lands after the inserted text.
 */
export function mapFlatPos(pos: FlatPos, change: FlatChange): FlatPos {
  const insertLen = change.insert.length;
  // Strictly before, not at: a position at the change site associates right —
  // a caret at column 0 rides an indent insert instead of being left behind.
  if (pos < change.from) return pos;
  if (pos >= change.to) return pos - (change.to - change.from) + insertLen;
  return change.from + insertLen;
}
