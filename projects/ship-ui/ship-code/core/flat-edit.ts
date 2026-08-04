// ---------------------------------------------------------------------------
// ShipCode — Flat Editing
// ---------------------------------------------------------------------------
//
// Edits expressed in flat offsets, applied through the proven line-level
// primitives. Every application returns the inverse change, which is what a
// history stack (and eventually collaborative rebasing) consumes — the same
// shape as ship-editor's invertible ops.

import { CaretPosition } from './selection';
import { CodeDocument, CodeLine, deleteRange, insertText } from './document';
import { FlatChange, FlatPos, indexFor, mapFlatPos } from './line-index';

export interface FlatEditResult {
  readonly doc: CodeDocument;
  /** Changes that undo the applied ones, in application order for reverse replay. */
  readonly inverse: readonly FlatChange[];
}

/** Apply one flat change. */
export function applyFlatChange(doc: CodeDocument, change: FlatChange): FlatEditResult {
  const index = indexFor(doc);
  const from = Math.max(0, Math.min(change.from, index.size));
  const to = Math.max(from, Math.min(change.to, index.size));
  const removed = index.sliceText(from, to);

  let next = doc;
  if (to > from) next = deleteRange(next, index.pointAt(from), index.pointAt(to));
  if (change.insert) next = insertText(next, indexFor(next).pointAt(mapDeletedPos(from)), change.insert);

  const inverse: FlatChange = { from, to: from + change.insert.length, insert: removed };
  return { doc: next, inverse: [inverse] };

  function mapDeletedPos(pos: FlatPos): FlatPos {
    // After the delete, `from` addresses the join point directly.
    return pos;
  }
}

/**
 * Apply a sequence of flat changes. Each change's offsets address the document
 * as left by the previous change — the transaction shape `applyTransaction`
 * has always used, in flat coordinates.
 */
export function applyFlatChanges(doc: CodeDocument, changes: readonly FlatChange[]): FlatEditResult {
  let current = doc;
  const inverse: FlatChange[] = [];
  for (const change of changes) {
    const result = applyFlatChange(current, change);
    current = result.doc;
    inverse.unshift(...result.inverse);
  }
  return { doc: current, inverse };
}

/** Map a flat position through a whole change sequence. */
export function mapThroughChanges(pos: FlatPos, changes: readonly FlatChange[]): FlatPos {
  let mapped = pos;
  for (const change of changes) mapped = mapFlatPos(mapped, change);
  return mapped;
}

/**
 * Apply a batch of disjoint changes in one pass.
 *
 * `applyFlatChanges` costs O(lines) per change — it rebuilds the line index
 * (cached per document identity, and every step makes a new document) and
 * copies the whole line array. That is invisible for one caret and quadratic
 * for a thousand: a select-all-occurrences edit in a 50k-line file would be
 * hundreds of millions of line copies. This walks the lines once instead,
 * keeping untouched lines by identity, so a batch costs O(lines + edited text)
 * however many cursors produced it.
 *
 * Expects what `fanOutEdit` emits: changes that do not overlap, ordered
 * descending by `from`. Descending disjoint changes never disturb each other's
 * offsets, so addressing the original document — which is what this does — and
 * applying them one at a time agree exactly.
 */
export function applyFlatChangesBatched(doc: CodeDocument, changes: readonly FlatChange[]): FlatEditResult {
  if (changes.length === 0) return { doc, inverse: [] };
  if (changes.length === 1) return applyFlatChange(doc, changes[0]);

  const index = indexFor(doc);
  const size = index.size;
  const ordered = changes
    .map((change) => {
      const from = Math.max(0, Math.min(change.from, size));
      return { from, to: Math.max(from, Math.min(change.to, size)), insert: change.insert };
    })
    .sort((a, b) => a.from - b.from);

  const lines = doc.lines;
  const lastLine = lines.length - 1;
  const out: CodeLine[] = [];
  /** The output line being assembled, or null when the last one was closed. */
  let open: string | null = null;
  let at: CaretPosition = { line: 0, column: 0 };

  /** Copy original text from `at` up to `target`, closing lines as they end. */
  const copyTo = (target: CaretPosition) => {
    if (target.line === at.line) {
      open = (open ?? '') + lines[at.line].text.slice(at.column, target.column);
    } else {
      // A line consumed whole, with nothing built onto it, keeps its identity.
      if (open === null && at.column === 0) out.push(lines[at.line]);
      else out.push({ text: (open ?? '') + lines[at.line].text.slice(at.column) });
      for (let i = at.line + 1; i < target.line; i++) out.push(lines[i]);
      open = lines[target.line].text.slice(0, target.column);
    }
    at = target;
  };

  /** Append inserted text, which may open new lines. */
  const write = (text: string) => {
    const parts = text.split('\n');
    open = (open ?? '') + parts[0];
    for (let i = 1; i < parts.length; i++) {
      out.push({ text: open });
      open = parts[i];
    }
  };

  const inverse: FlatChange[] = [];
  let delta = 0;
  for (const change of ordered) {
    copyTo(index.pointAt(change.from));
    write(change.insert);
    at = index.pointAt(change.to);
    // The inverse addresses the *new* document, so it carries the shift from
    // every change below it.
    const shifted = change.from + delta;
    inverse.push({
      from: shifted,
      to: shifted + change.insert.length,
      insert: index.sliceText(change.from, change.to),
    });
    delta += change.insert.length - (change.to - change.from);
  }
  copyTo({ line: lastLine, column: lines[lastLine].text.length });
  out.push({ text: open ?? '' });

  // Highest-first, so replaying them in order never disturbs a later one.
  inverse.reverse();
  return { doc: { lines: out }, inverse };
}
