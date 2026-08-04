// ---------------------------------------------------------------------------
// ShipEditor — Multi-Range Selection
// ---------------------------------------------------------------------------
//
// The browser gives a contenteditable exactly one selection range, so multi
// cursor here is a layered model rather than a replacement one: `live` stays
// the single primary range every existing code path already reads and writes,
// and the extra cursors live beside it. The union is kept sorted and disjoint
// for the same two reasons `flat-multi` does it in ship-code —
//
//   sorted   — the mounted window is a slice of the document, so deciding what
//              to paint is a binary search over cursors rather than a scan.
//   disjoint — no character is owned by two cursors, so fanning an edit out
//              can never produce two edits over the same text.
//
// Unlike ship-code's ranges these carry no direction: a `LogicalSelection` is
// already ordered `from <= to`.

import { LogicalSelection } from './editor.types';

/** Sort and merge ranges into a canonical, disjoint set. */
export function normalizeLogical(ranges: readonly LogicalSelection[]): LogicalSelection[] {
  if (ranges.length <= 1) return ranges.map((range) => ({ ...range }));
  const sorted = [...ranges].sort((a, b) => a.from - b.from || a.to - b.to);
  const out: LogicalSelection[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const last = out[out.length - 1];
    // `<=` merges touching ranges too: a caret at a selection's edge is inside
    // it, not a second cursor.
    if (next.from <= last.to) last.to = Math.max(last.to, next.to);
    else out.push({ ...next });
  }
  return out;
}

/** Where `range` sits in a normalized set, or -1 when it was merged away. */
export function indexOfRange(ranges: readonly LogicalSelection[], range: LogicalSelection): number {
  return ranges.findIndex((candidate) => candidate.from <= range.from && candidate.to >= range.to);
}

/**
 * The ranges intersecting the span [from, to], by binary search.
 *
 * The paint layer calls this every window move; a document may hold thousands
 * of cursors while a few dozen blocks are mounted, so the cost has to follow
 * the window rather than the cursor count.
 */
export function logicalRangesInSpan(
  ranges: readonly LogicalSelection[],
  from: number,
  to: number
): LogicalSelection[] {
  let lo = 0;
  let hi = ranges.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid].to < from) lo = mid + 1;
    else hi = mid;
  }
  const out: LogicalSelection[] = [];
  for (let i = lo; i < ranges.length; i++) {
    if (ranges[i].from > to) break;
    out.push(ranges[i]);
  }
  return out;
}

/** Shift a range by `delta`, clamped at zero. */
export function shiftRange(range: LogicalSelection, delta: number): LogicalSelection {
  return { from: Math.max(0, range.from + delta), to: Math.max(0, range.to + delta) };
}
