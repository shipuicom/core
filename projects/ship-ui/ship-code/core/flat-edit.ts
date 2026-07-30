// ---------------------------------------------------------------------------
// ShipCode — Flat Editing
// ---------------------------------------------------------------------------
//
// Edits expressed in flat offsets, applied through the proven line-level
// primitives. Every application returns the inverse change, which is what a
// history stack (and eventually collaborative rebasing) consumes — the same
// shape as ship-editor's invertible ops.

import { CodeDocument, deleteRange, insertText } from './document';
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
