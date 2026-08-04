// ---------------------------------------------------------------------------
// ShipCode — Multi-Range Selection Algebra
// ---------------------------------------------------------------------------
//
// Multi-caret editing is N ranges over the flat position space, and everything
// here exists to hold two invariants the virtualized surface leans on:
//
//   sorted   — ranges ascend by their ordered `from`, so painting the mounted
//              window is a binary search plus a short walk rather than a scan
//              over every cursor. Select-all-occurrences in a large file can
//              produce tens of thousands of ranges; paint cost has to follow
//              what is on screen, not how many cursors exist.
//   disjoint — overlaps are merged on construction, so no character is ever
//              owned by two cursors and a fanned-out edit can never emit two
//              changes that touch the same text.
//
// The primary range is tracked by index, not by position: it is the one the
// caret follows and the only one scroll-into-view obeys, so it has to survive
// the sort.

import {
  FlatRange,
  FlatSelection,
  MotionResult,
  flatOrdered,
  isFlatCollapsed,
  primaryFlat,
} from './flat-motion';
import { FlatChange, FlatPos, mapFlatPos } from './line-index';

/** Rebuild a range spanning [from, to] with `dir`'s direction and goal column. */
function orient(from: FlatPos, to: FlatPos, dir: FlatRange): FlatRange {
  const forward = dir.anchor <= dir.head;
  const range: FlatRange = forward ? { anchor: from, head: to } : { anchor: to, head: from };
  return dir.goalColumn === undefined ? range : { ...range, goalColumn: dir.goalColumn };
}

/**
 * Sort, merge, and re-point a set of ranges into a canonical selection.
 *
 * `primary` names — by index into `ranges` — the range that should stay
 * primary. If it merges into a neighbour the merged range inherits both its
 * identity and its direction, so extending a selection that swallows another
 * cursor keeps moving the end the user is dragging.
 */
export function normalizeSelection(ranges: readonly FlatRange[], primary = 0): FlatSelection {
  if (ranges.length === 0) return { ranges: [{ anchor: 0, head: 0 }], primary: 0 };
  if (ranges.length === 1) return { ranges: [ranges[0]], primary: 0 };

  const tagged = ranges.map((range, order) => {
    const { from, to } = flatOrdered(range);
    return { range, from, to, order, isPrimary: order === primary };
  });
  tagged.sort((a, b) => a.from - b.from || a.to - b.to || a.order - b.order);

  const out: FlatRange[] = [];
  let primaryOut = 0;
  let from = tagged[0].from;
  let to = tagged[0].to;
  let dir = tagged[0].range;
  let hasPrimary = tagged[0].isPrimary;

  const flush = () => {
    if (hasPrimary) primaryOut = out.length;
    out.push(orient(from, to, dir));
  };

  for (let i = 1; i < tagged.length; i++) {
    const next = tagged[i];
    // `<=` merges touching ranges too: a caret sitting at the end of a
    // selection is inside it, not a second cursor.
    if (next.from <= to) {
      if (next.to > to) to = next.to;
      if (next.isPrimary) {
        hasPrimary = true;
        dir = next.range;
      }
      continue;
    }
    flush();
    from = next.from;
    to = next.to;
    dir = next.range;
    hasPrimary = next.isPrimary;
  }
  flush();
  return { ranges: out, primary: primaryOut };
}

/** Add a cursor; the newcomer becomes primary, as every editor's Alt+click does. */
export function addFlatRange(sel: FlatSelection, range: FlatRange): FlatSelection {
  const ranges = [...sel.ranges, range];
  return normalizeSelection(ranges, ranges.length - 1);
}

/** Replace the primary range, leaving the other cursors alone. */
export function setPrimaryRange(sel: FlatSelection, range: FlatRange): FlatSelection {
  const at = sel.primary ?? 0;
  const ranges = sel.ranges.slice();
  ranges[at] = range;
  return normalizeSelection(ranges, at);
}

/** Drop every cursor but the primary — Escape, and the start of composition. */
export function collapseToPrimary(sel: FlatSelection): FlatSelection {
  if (sel.ranges.length <= 1) return sel;
  return { ranges: [primaryFlat(sel)], primary: 0 };
}

/** More than one cursor is live. */
export function isMultiRange(sel: FlatSelection): boolean {
  return sel.ranges.length > 1;
}

/**
 * The ranges intersecting the flat span [from, to].
 *
 * Binary search, not a scan. The mounted window of a virtualized surface is a
 * few dozen lines while the selection may hold tens of thousands of ranges, so
 * every scroll frame must cost O(log N + visible), never O(N).
 */
export function rangesInSpan(sel: FlatSelection, from: FlatPos, to: FlatPos): FlatRange[] {
  const ranges = sel.ranges;
  // Sorted and disjoint means the ordered `to` edges ascend as well, so the
  // first range that can intersect is the first whose `to` reaches `from`.
  let lo = 0;
  let hi = ranges.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (flatOrdered(ranges[mid]).to < from) lo = mid + 1;
    else hi = mid;
  }
  const out: FlatRange[] = [];
  for (let i = lo; i < ranges.length; i++) {
    if (flatOrdered(ranges[i]).from > to) break;
    out.push(ranges[i]);
  }
  return out;
}

/** Carry every cursor through a change sequence — undo, redo, a foreign edit. */
export function mapSelectionThroughChanges(
  sel: FlatSelection,
  changes: readonly FlatChange[]
): FlatSelection {
  const mapped = sel.ranges.map((range) => {
    let anchor = range.anchor;
    let head = range.head;
    for (const change of changes) {
      anchor = mapFlatPos(anchor, change);
      head = mapFlatPos(head, change);
    }
    return { anchor, head } as FlatRange;
  });
  return normalizeSelection(mapped, sel.primary ?? 0);
}

/** One cursor's contribution to a fanned-out edit. */
export interface RangeEdit {
  readonly change: FlatChange;
  /**
   * Where this cursor lands, in coordinates where only its own change has been
   * applied — `change.from + inserted.length` for a plain insert. The shift
   * from every lower-offset cursor is added by `fanOutEdit`, so callers never
   * do cross-cursor offset arithmetic.
   */
  readonly anchorAfter: FlatPos;
  readonly headAfter: FlatPos;
}

export interface FanOutResult {
  /** Descending by `from`: a change never disturbs the offsets below it. */
  readonly changes: readonly FlatChange[];
  readonly selection: FlatSelection;
}

/**
 * Run one edit per cursor and assemble a single transaction — one history
 * entry, one undo, however many cursors are live.
 *
 * Returning `null` for a range means "this cursor has nothing to do": it keeps
 * its place and rides the shift from the other cursors' edits, which is what
 * an outdent on an already-flush line does.
 *
 * Assumes each cursor's change stays within its own neighbourhood, which the
 * disjoint invariant gives for every edit `sh-code` fans out.
 */
export function fanOutEdit(
  sel: FlatSelection,
  edit: (range: FlatRange, index: number) => RangeEdit | null
): FanOutResult | null {
  const changes: FlatChange[] = [];
  const ranges: FlatRange[] = [];
  let delta = 0;
  for (let i = 0; i < sel.ranges.length; i++) {
    const range = sel.ranges[i];
    const result = edit(range, i);
    if (!result) {
      ranges.push({ anchor: range.anchor + delta, head: range.head + delta });
      continue;
    }
    changes.push(result.change);
    ranges.push({ anchor: result.anchorAfter + delta, head: result.headAfter + delta });
    delta += result.change.insert.length - (result.change.to - result.change.from);
  }
  if (changes.length === 0) return null;
  changes.reverse();
  return { changes, selection: normalizeSelection(ranges, sel.primary ?? 0) };
}

/**
 * Move every cursor, each computing its motion from its own head.
 *
 * Cursors that collide merge, which is why holding an arrow key with several
 * carets in a short region settles down to fewer of them rather than piling up
 * duplicates at the document edge.
 */
export function applyMotionAll(
  sel: FlatSelection,
  move: (pos: FlatPos, goalColumn?: number) => MotionResult,
  extend: boolean,
  collapseEdge?: 'from' | 'to'
): FlatSelection {
  const ranges = sel.ranges.map<FlatRange>((range) => {
    const motion = move(range.head, range.goalColumn);
    if (extend) return { anchor: range.anchor, head: motion.head, goalColumn: motion.goalColumn };
    if (collapseEdge && !isFlatCollapsed(range)) {
      const { from, to } = flatOrdered(range);
      const at = collapseEdge === 'from' ? from : to;
      return { anchor: at, head: at, goalColumn: motion.goalColumn };
    }
    return { anchor: motion.head, head: motion.head, goalColumn: motion.goalColumn };
  });
  return normalizeSelection(ranges, sel.primary ?? 0);
}

// ---------------------------------------------------------------------------
// Occurrence search — the model side of Cmd+D / Cmd+Shift+L.
//
// A flat position is exactly a string index into `getText(doc)`: every line
// costs its length plus one slot for the newline, which is what `join('\n')`
// produces. So the search runs on the plain text and its results need no
// translation. It must run over the whole document, never the mounted window —
// the match the user wants is usually off-screen.
// ---------------------------------------------------------------------------

export interface Occurrence {
  readonly from: FlatPos;
  readonly to: FlatPos;
}

/** The first occurrence of `needle` at or after `at`, wrapping to the top. */
export function nextOccurrence(text: string, needle: string, at: FlatPos): Occurrence | null {
  if (!needle) return null;
  let found = text.indexOf(needle, at);
  if (found === -1) found = text.indexOf(needle);
  if (found === -1) return null;
  return { from: found, to: found + needle.length };
}

/**
 * Every occurrence of `needle`, capped. The cap is a real limit and not a
 * formality: a short needle in a large file can match hundreds of thousands of
 * times, and each match becomes a live cursor.
 */
export function allOccurrences(text: string, needle: string, limit = 10_000): Occurrence[] {
  if (!needle) return [];
  const out: Occurrence[] = [];
  let at = 0;
  while (out.length < limit) {
    const found = text.indexOf(needle, at);
    if (found === -1) break;
    out.push({ from: found, to: found + needle.length });
    at = found + needle.length;
  }
  return out;
}
