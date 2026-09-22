// ---------------------------------------------------------------------------
// ShipSpreadsheet — operational transform over SheetOp
// ---------------------------------------------------------------------------
//
// `transformSheetOp(op, against, side)` rewrites `op` — authored against a
// model that did not know `against` — so that it applies after `against` and
// both orders converge (TP1):
//
//   apply(apply(m, a), transform(b, a, 'right')) ≡ apply(apply(m, b), transform(a, b, 'left'))
//
// A transform yields a *list*: `[]` when the op no longer has a target (its
// rows were removed, its width target vanished), one op in the common case,
// and two when a structural op lands strictly inside the op's extent (an
// insert inside a `set-cells` rectangle splits it; an insert inside a removed
// band splits the removal around the new rows).
//
// `side` breaks symmetric ties the way `transformOp` in ship-editor does:
// the `'right'` op yields to the `'left'` one — its insert lands after a
// concurrent insert at the same index, its cell values lose an overlap, its
// size for the same track is dropped. Both peers must pick opposite sides
// for the same pair (the collab service derives it from client ids).
//
// Precondition: ops are in range for the model they were authored against
// (`applySheetOp` clamps an out-of-range op, so its meaning would depend on
// the model size and no model-free transform could converge it). The
// composer only emits in-range ops; a transport that accepts ops from
// elsewhere should validate them against its snapshot before applying.

import { SheetOp } from './sheet-model';

export type SheetOpSide = 'left' | 'right';

type Axis = 'row' | 'col';

/** A structural op reduced to what index arithmetic needs. */
interface Splice {
  readonly axis: Axis;
  readonly at: number;
  readonly remove: number;
  readonly insert: number;
}

function spliceOf(op: SheetOp): Splice | null {
  switch (op.kind) {
    case 'insert-rows':
      return { axis: 'row', at: op.at, remove: 0, insert: op.count };
    case 'remove-rows':
      return { axis: 'row', at: op.at, remove: op.count, insert: 0 };
    case 'insert-cols':
      return { axis: 'col', at: op.at, remove: 0, insert: op.count };
    case 'remove-cols':
      return { axis: 'col', at: op.at, remove: op.count, insert: 0 };
    default:
      return null;
  }
}

const other = (side: SheetOpSide): SheetOpSide => (side === 'left' ? 'right' : 'left');

/** A `set-cells` with nothing to write is dropped rather than carried. */
function pruneSetCells(op: Extract<SheetOp, { kind: 'set-cells' }>): SheetOp[] {
  return op.values.length > 0 && op.values.some((line) => line.length > 0) ? [op] : [];
}

// ---------------------------------------------------------------------------
// Index arithmetic on one axis
// ---------------------------------------------------------------------------

/** A single track index (a width/height target) through a splice; `null` when the track was removed. */
function mapPoint(index: number, s: Splice): number | null {
  if (s.remove > 0 && index >= s.at && index < s.at + s.remove) return null;
  return index >= s.at + s.remove ? index + s.insert - s.remove : index;
}

/** An insertion point through a splice on the same axis. */
function mapInsertAt(at: number, s: Splice, side: SheetOpSide): number {
  if (s.insert > 0) {
    if (at < s.at) return at;
    if (at > s.at) return at + s.insert;
    return side === 'right' ? at + s.insert : at;
  }
  if (at <= s.at) return at;
  if (at >= s.at + s.remove) return at - s.remove;
  return s.at;
}

/**
 * A removed band `[at, at+count)` through a splice on the same axis. An
 * insert strictly inside the band splits it around the new tracks (the
 * high part first, so the low part's index is unaffected); a concurrent
 * removal subtracts its overlap.
 */
function mapRemoveBand(at: number, count: number, s: Splice): { at: number; count: number }[] {
  const end = at + count;
  if (s.insert > 0) {
    if (s.at <= at) return [{ at: at + s.insert, count }];
    if (s.at >= end) return [{ at, count }];
    return [
      { at: s.at + s.insert, count: end - s.at },
      { at, count: s.at - at },
    ];
  }
  const sEnd = s.at + s.remove;
  const overlap = Math.max(0, Math.min(end, sEnd) - Math.max(at, s.at));
  const remaining = count - overlap;
  if (remaining === 0) return [];
  const start = at < s.at ? at : at >= sEnd ? at - s.remove : s.at;
  return [{ at: start, count: remaining }];
}

// ---------------------------------------------------------------------------
// set-cells through a splice — split on insert, clip on remove
// ---------------------------------------------------------------------------

type SetCells = Extract<SheetOp, { kind: 'set-cells' }>;

function setCellsThroughSplice(op: SetCells, s: Splice): SheetOp[] {
  const start = s.axis === 'row' ? op.row : op.col;
  const extent = s.axis === 'row' ? op.values.length : Math.max(0, ...op.values.map((line) => line.length));
  const slice = (from: number, to: number): (readonly string[])[] =>
    s.axis === 'row' ? op.values.slice(from, to) : op.values.map((line) => line.slice(from, to));
  const withStart = (values: (readonly string[])[], at: number): SetCells =>
    s.axis === 'row' ? { ...op, row: at, values } : { ...op, col: at, values };

  if (s.insert > 0) {
    if (s.at <= start) return [withStart(op.values.slice(), start + s.insert)];
    if (s.at >= start + extent) return [op];
    // Strictly inside: the part before the insert stays, the rest moves past it.
    return [
      ...pruneSetCells(withStart(slice(0, s.at - start), start)),
      ...pruneSetCells(withStart(slice(s.at - start, extent), s.at + s.insert)),
    ];
  }

  const sEnd = s.at + s.remove;
  if (sEnd <= start) return [withStart(op.values.slice(), start - s.remove)];
  if (s.at >= start + extent) return [op];
  if (start < s.at) {
    // Rows/cols before the band keep their place; those after it slide up to
    // meet them, so the survivors are still one rectangle.
    const before = slice(0, s.at - start);
    const after = slice(sEnd - start, extent);
    const merged = s.axis === 'row' ? [...before, ...after] : before.map((line, i) => [...line, ...(after[i] ?? [])]);
    return pruneSetCells(withStart(merged, start));
  }
  // The anchor sits inside the band: only the part past it survives, now at the band's start.
  return pruneSetCells(withStart(slice(sEnd - start, extent), s.at));
}

/**
 * The overlap of two rectangles, cell by cell, with `winner`'s values
 * written into `loser` — so applying the loser after the winner leaves the
 * winner's values, exactly as the other order does.
 */
function yieldOverlap(loser: SetCells, winner: SetCells): SheetOp[] {
  let changed = false;
  const values = loser.values.map((line, r) => {
    const row = loser.row + r;
    const wr = row - winner.row;
    const winnerLine = wr >= 0 ? winner.values[wr] : undefined;
    if (!winnerLine) return line;
    let out: string[] | null = null;
    for (let c = 0; c < line.length; c++) {
      const wc = loser.col + c - winner.col;
      if (wc < 0 || wc >= winnerLine.length) continue;
      if (!out) out = line.slice();
      out[c] = winnerLine[wc];
      changed = true;
    }
    return out ?? line;
  });
  return changed ? [{ ...loser, values }] : [loser];
}

// ---------------------------------------------------------------------------
// Restored data riding on an insert, through a splice on the other axis
// ---------------------------------------------------------------------------

/**
 * `insert-rows.cells` is row-major (`count` lines of the old column count)
 * and `insert-cols.cells` column-major (`count` lines of the old row
 * count). A concurrent splice on the other axis changes that line length,
 * so the lines are reshaped — blanks spliced in, removed tracks cut out —
 * to keep the restored data aligned when it is finally applied.
 */
function reshapeLines(cells: readonly string[], lines: number, s: Splice): string[] {
  if (lines <= 0 || cells.length === 0) return cells.slice();
  const width = Math.ceil(cells.length / lines);
  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    const line: string[] = [];
    for (let j = 0; j < width; j++) line.push(cells[i * width + j] ?? '');
    const at = Math.min(s.at, line.length);
    line.splice(at, s.remove, ...new Array<string>(s.insert).fill(''));
    out.push(...line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The pairwise transform
// ---------------------------------------------------------------------------

/**
 * Rewrite `op` to apply after the concurrent `against`. Returns the ops that
 * replace it: none, one, or two — see the file header.
 */
export function transformSheetOp(op: SheetOp, against: SheetOp, side: SheetOpSide = 'left'): SheetOp[] {
  const s = spliceOf(against);

  if (op.kind === 'set-cells') {
    if (s) return setCellsThroughSplice(op, s);
    if (against.kind === 'set-cells' && side === 'right') return yieldOverlap(op, against);
    return [op];
  }

  if (op.kind === 'set-col-width' || op.kind === 'set-col-type' || op.kind === 'set-row-height') {
    // A point op on one track: it moves with the track, vanishes with it,
    // and yields to a concurrent write of the same property on the same track.
    const axis: Axis = op.kind === 'set-row-height' ? 'row' : 'col';
    if (s) {
      if (s.axis !== axis) return [op];
      const index = mapPoint(op.kind === 'set-row-height' ? op.row : op.col, s);
      if (index === null) return [];
      return [op.kind === 'set-row-height' ? { ...op, row: index } : { ...op, col: index }];
    }
    if (against.kind === op.kind && side === 'right') {
      const same = op.kind === 'set-row-height' ? op.row === (against as { row: number }).row : op.col === (against as { col: number }).col;
      if (same) return [];
    }
    return [op];
  }

  // op is structural from here on.
  const mine = spliceOf(op)!;
  if (!s) return [op];

  if (s.axis !== mine.axis) {
    // Independent axes; only restored data on an insert needs reshaping.
    if (op.kind === 'insert-rows' && op.cells) return [{ ...op, cells: reshapeLines(op.cells, op.count, s) }];
    if (op.kind === 'insert-cols' && op.cells) return [{ ...op, cells: reshapeLines(op.cells, op.count, s) }];
    return [op];
  }

  if (mine.insert > 0) {
    const at = mapInsertAt(mine.at, s, side);
    return [at === op.at ? op : { ...op, at }];
  }

  return mapRemoveBand(mine.at, mine.remove, s).map((band) => ({ ...op, at: band.at, count: band.count }));
}

/**
 * Transform two concurrent op sequences against each other. `ops` plays
 * `side`; `against` plays the opposite. Both results apply after the other's
 * original sequence, and the two orders converge.
 */
export function transformSheetOps(
  ops: readonly SheetOp[],
  against: readonly SheetOp[],
  side: SheetOpSide = 'left'
): { ops: SheetOp[]; against: SheetOp[] } {
  if (ops.length === 0 || against.length === 0) return { ops: ops.slice(), against: against.slice() };
  if (ops.length === 1 && against.length === 1) {
    return { ops: transformSheetOp(ops[0], against[0], side), against: transformSheetOp(against[0], ops[0], other(side)) };
  }
  if (ops.length > 1) {
    const head = transformSheetOps([ops[0]], against, side);
    const tail = transformSheetOps(ops.slice(1), head.against, side);
    return { ops: [...head.ops, ...tail.ops], against: tail.against };
  }
  const head = transformSheetOps(ops, [against[0]], side);
  const tail = transformSheetOps(head.ops, against.slice(1), side);
  return { ops: tail.ops, against: [...head.against, ...tail.against] };
}

/**
 * Rebase a local sequence over concurrent ops that already applied here, in
 * their order — the shape `rebaseOp` has in ship-editor. Each entry of
 * `against` already accounts for the ones before it.
 */
export function rebaseSheetOps(ops: readonly SheetOp[], against: readonly SheetOp[], side: SheetOpSide = 'left'): SheetOp[] {
  let current: SheetOp[] = ops.slice();
  for (const a of against) {
    if (current.length === 0) break;
    current = transformSheetOps(current, [a], side).ops;
  }
  return current;
}
