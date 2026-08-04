// ---------------------------------------------------------------------------
// ShipCode — Line Reordering
// ---------------------------------------------------------------------------
//
// Move the selected lines up or down past their neighbour — the code-editor
// gesture (VS Code's Alt+Arrow, Sublime's Cmd/Ctrl+Shift+Arrow). Pure over
// (document, selection): it returns the flat changes to apply and where the
// selection lands, so the component keeps sole ownership of history.
//
// With several cursors the work is done on a permutation of the line order
// rather than by patching text spans directly. Each cursor group hops its
// neighbour independently, and the resulting order is turned into one change
// at the end — which keeps the multi-cursor case from degenerating into a pile
// of interacting edits, and makes "the group at the document edge stays put
// while the others move" fall out for free.

import { CodeDocument } from './document';
import { FlatChange, FlatPos, indexFor } from './line-index';
import { FlatRange, FlatSelection, flatOrdered, primaryFlat } from './flat-motion';
import { normalizeSelection } from './flat-multi';

export interface LineMove {
  readonly changes: readonly FlatChange[];
  readonly selection: FlatSelection;
}

export interface LineSpan {
  first: number;
  last: number;
}

/**
 * The line span the primary selection touches. A selection ending exactly at a
 * line's start hasn't entered that line — sweeping three full lines downward
 * selects up to the fourth line's offset 0, and moving four lines there would
 * be a surprise.
 */
export function selectedLineSpan(doc: CodeDocument, selection: FlatSelection): LineSpan {
  return spanOf(doc, primaryFlat(selection));
}

function spanOf(doc: CodeDocument, range: FlatRange): LineSpan {
  const index = indexFor(doc);
  const { from, to } = flatOrdered(range);
  const first = index.pointAt(from).line;
  const rawLast = index.pointAt(to).line;
  const last = rawLast > first && to === index.startOf(rawLast) ? rawLast - 1 : rawLast;
  return { first, last };
}

/**
 * The line spans every cursor touches, merged and ascending.
 *
 * Adjacent spans merge as well as overlapping ones: two cursors on
 * consecutive lines have to travel as one block, or they would swap places
 * with each other instead of moving.
 */
export function selectedLineGroups(doc: CodeDocument, selection: FlatSelection): LineSpan[] {
  const groups: LineSpan[] = [];
  for (const range of selection.ranges) {
    const span = spanOf(doc, range);
    const prev = groups[groups.length - 1];
    if (prev && span.first <= prev.last + 1) prev.last = Math.max(prev.last, span.last);
    else groups.push(span);
  }
  return groups;
}

/**
 * Move every selected line group one slot in `direction`. Returns `null` when
 * no group could move — every one of them is already against that edge.
 *
 * A group travels as one unit and its cursors ride along, so holding the
 * shortcut walks blocks of lines through the file with the same text selected
 * the whole way.
 */
export function moveLines(doc: CodeDocument, selection: FlatSelection, direction: -1 | 1): LineMove | null {
  const index = indexFor(doc);
  const lineCount = index.lineCount;
  const groups = selectedLineGroups(doc, selection);

  /** `order[i]` is the original line index now sitting at position i. */
  const order = Array.from({ length: lineCount }, (_, i) => i);
  /** Inverse of `order`, so a group's current position is a lookup, not a scan. */
  const posOf = new Int32Array(lineCount);
  for (let i = 0; i < lineCount; i++) posOf[i] = i;

  const hop = (at: number, width: number, delta: number) => {
    const block = order.splice(at, width);
    order.splice(at + delta, 0, ...block);
    const lo = Math.min(at, at + delta);
    const hi = Math.max(at + width, at + width + delta);
    for (let i = lo; i < hi; i++) posOf[order[i]] = i;
  };

  let moved = false;
  if (direction === -1) {
    // Top-down: a group pinned at the top still leaves the ones below it free.
    for (const group of groups) {
      const at = posOf[group.first];
      if (at === 0) continue;
      hop(at, group.last - group.first + 1, -1);
      moved = true;
    }
  } else {
    // Bottom-up, for the same reason mirrored.
    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i];
      const at = posOf[group.first];
      const width = group.last - group.first + 1;
      if (at + width >= lineCount) continue;
      hop(at, width, 1);
      moved = true;
    }
  }
  if (!moved) return null;

  // One change spanning everything that actually shifted. The permutation only
  // reorders lines, so the replaced text and its replacement have equal length.
  let lo = 0;
  while (lo < lineCount && order[lo] === lo) lo++;
  let hi = lineCount - 1;
  while (hi > lo && order[hi] === hi) hi--;
  const texts: string[] = [];
  for (let i = lo; i <= hi; i++) texts.push(doc.lines[order[i]].text);

  // Cursors are remapped through the permutation rather than shifted by a
  // pixel-count, which is what keeps them attached to their own text when
  // several groups move different distances.
  const newStart = new Float64Array(lineCount);
  let at = 0;
  for (let i = 0; i < lineCount; i++) {
    newStart[i] = at;
    at += doc.lines[order[i]].text.length + 1;
  }
  const remap = (pos: FlatPos, isRangeEnd: boolean): FlatPos => {
    const point = index.pointAt(pos);
    // The exclusive end of a full-line sweep sits at the next line's offset 0 —
    // a line `spanOf` deliberately excludes from the move. Keep that endpoint
    // attached to the end of the last selected line, not to wherever the
    // excluded line went. (Clamped: the selected line may now be the last.)
    if (isRangeEnd && point.column === 0 && point.line > 0) {
      const prev = point.line - 1;
      return Math.min(newStart[posOf[prev]] + doc.lines[prev].text.length + 1, index.size);
    }
    return newStart[posOf[point.line]] + point.column;
  };
  const ranges = selection.ranges.map<FlatRange>((range) => {
    const isEnd = (pos: FlatPos) => range.anchor !== range.head && pos === Math.max(range.anchor, range.head);
    const anchor = remap(range.anchor, isEnd(range.anchor));
    const head = remap(range.head, isEnd(range.head));
    return range.goalColumn === undefined ? { anchor, head } : { anchor, head, goalColumn: range.goalColumn };
  });

  return {
    changes: [{ from: index.startOf(lo), to: index.endOf(hi), insert: texts.join('\n') }],
    selection: normalizeSelection(ranges, selection.primary ?? 0),
  };
}
