// ---------------------------------------------------------------------------
// ShipCode — Flat Editing
// ---------------------------------------------------------------------------
//
// Edits expressed in flat offsets, applied through the proven line-level
// primitives. Every application returns the inverse change, which is what a
// history stack (and eventually collaborative rebasing) consumes — the same
// shape as ship-editor's invertible ops.

import { CodeDocument, replaceRange } from './document';
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

  const next = to > from || change.insert ? replaceRange(doc, index.pointAt(from), index.pointAt(to), change.insert) : doc;

  const inverse: FlatChange = { from, to: from + change.insert.length, insert: removed };
  return { doc: next, inverse: [inverse] };
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
 * Apply a batch of disjoint changes (what `fanOutEdit` emits for many cursors).
 *
 * Each change is one O(log n) splice of the line tree, applied highest offset first: a change never moves the text
 * below it, so every change can address the original document. A batch costs O(changes × log lines), not a pass
 * over the document, however many cursors produced it.
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

  let next = doc;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const change = ordered[i]!;
    if (change.to > change.from || change.insert) next = replaceRange(next, index.pointAt(change.from), index.pointAt(change.to), change.insert);
  }

  // The inverse addresses the *new* document, so each carries the shift from every change below it.
  const inverse: FlatChange[] = [];
  let delta = 0;
  for (const change of ordered) {
    const shifted = change.from + delta;
    inverse.push({ from: shifted, to: shifted + change.insert.length, insert: index.sliceText(change.from, change.to) });
    delta += change.insert.length - (change.to - change.from);
  }
  // Highest-first, so replaying them in order never disturbs a later one.
  inverse.reverse();
  return { doc: next, inverse };
}
