// ---------------------------------------------------------------------------
// ShipCode — Columnar Line Index
// ---------------------------------------------------------------------------
//
// The flat-position machinery, mirroring ship-editor's columnar model: the
// document's lines are the storage column, and this index is the lazily built
// prefix-sum array over them. A flat position counts characters with one slot
// per newline, so `moveRight` is `pos + 1` even across line boundaries and a
// selection is just `{anchor, head}` numbers — the same properties that
// motivated the editor's flat-selection migration.
//
// The index is immutable, built once per document value and cached in a
// WeakMap: documents share structure across edits, but the prefix sums are
// global, so an edit invalidates the whole index. A rebuild is one pass over
// the line lengths into a Float64Array (~µs at 10k lines), which is cheaper
// than keeping an incremental structure correct — the same trade
// BlockHeightMap makes for viewport heights.

import { CodeDocument } from './document';
import { CaretPosition } from './selection';

/** A flat character offset in [0, size]. Newlines occupy one slot each. */
export type FlatPos = number;

export class LineIndex {
  /** starts[i] = flat offset of line i's first character; starts[lineCount] = size + 1 sentinel. */
  #starts: Float64Array;
  #size: number;
  #doc: CodeDocument;

  constructor(doc: CodeDocument) {
    this.#doc = doc;
    const lines = doc.lines;
    const starts = new Float64Array(lines.length + 1);
    let at = 0;
    for (let i = 0; i < lines.length; i++) {
      starts[i] = at;
      at += lines[i].text.length + 1; // +1 for the newline slot
    }
    starts[lines.length] = at;
    this.#starts = starts;
    this.#size = at - 1; // the last line has no trailing newline
  }

  /** Total flat length of the document. Valid positions are [0, size]. */
  get size(): number {
    return this.#size;
  }

  get lineCount(): number {
    return this.#doc.lines.length;
  }

  /** Flat offset of `line`'s first character. */
  startOf(line: number): FlatPos {
    return this.#starts[Math.max(0, Math.min(line, this.lineCount - 1))];
  }

  /** Flat offset just past `line`'s last character (before its newline slot). */
  endOf(line: number): FlatPos {
    const clamped = Math.max(0, Math.min(line, this.lineCount - 1));
    return this.#starts[clamped] + this.#doc.lines[clamped].text.length;
  }

  /** The line whose span contains flat position `pos`. */
  lineAt(pos: FlatPos): number {
    const starts = this.#starts;
    const count = this.lineCount;
    if (pos <= 0) return 0;
    if (pos >= this.#size) return count - 1;
    // Largest i with starts[i] <= pos.
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** Flat position of a line/column point, clamping the column to the line. */
  posOf(point: CaretPosition): FlatPos {
    const line = Math.max(0, Math.min(point.line, this.lineCount - 1));
    const len = this.#doc.lines[line].text.length;
    return this.#starts[line] + Math.max(0, Math.min(point.column, len));
  }

  /** Line/column point of a flat position, clamped to [0, size]. */
  pointAt(pos: FlatPos): CaretPosition {
    const clamped = Math.max(0, Math.min(pos, this.#size));
    const line = this.lineAt(clamped);
    const column = Math.min(clamped - this.#starts[line], this.#doc.lines[line].text.length);
    return { line, column };
  }

  /** Document text in [from, to), newlines included. */
  sliceText(from: FlatPos, to: FlatPos): string {
    const a = Math.max(0, Math.min(from, to, this.#size));
    const b = Math.min(this.#size, Math.max(from, to));
    if (a === b) return '';
    const start = this.pointAt(a);
    const end = this.pointAt(b);
    if (start.line === end.line) return this.#doc.lines[start.line].text.slice(start.column, end.column);
    const parts: string[] = [this.#doc.lines[start.line].text.slice(start.column)];
    for (let l = start.line + 1; l < end.line; l++) parts.push(this.#doc.lines[l].text);
    parts.push(this.#doc.lines[end.line].text.slice(0, end.column));
    return parts.join('\n');
  }
}

const CACHE = new WeakMap<CodeDocument, LineIndex>();

/** The (cached) index for a document value. One build per document identity. */
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
  if (pos <= change.from) return pos;
  if (pos >= change.to) return pos - (change.to - change.from) + insertLen;
  return change.from + insertLen;
}
