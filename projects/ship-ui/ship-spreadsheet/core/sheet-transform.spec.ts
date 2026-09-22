import { describe, expect, it } from 'vitest';
import { SheetModel, SheetOp, applySheetOp, applySheetOps, createSheet } from './sheet-model';
import { rebaseSheetOps, transformSheetOp, transformSheetOps } from './sheet-transform';

const SCALE = Math.max(1, Number(globalThis.process?.env?.['FUZZ_SCALE'] ?? 1) || 1);

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rnd = () => number;
const pick = (rnd: Rnd, n: number) => Math.floor(rnd() * n);
const deepEq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function labelled(rows: number, cols: number): SheetModel {
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(`r${r}c${c}`);
  let model = createSheet(rows, cols, cells);
  for (let c = 0; c < cols; c += 2) model = applySheetOp(model, { kind: 'set-col-width', col: c, width: 50 + c }).model;
  for (let r = 1; r < rows; r += 3) model = applySheetOp(model, { kind: 'set-row-height', row: r, height: 20 + r }).model;
  return model;
}

function randomModel(rnd: Rnd): SheetModel {
  return labelled(1 + pick(rnd, 6), 1 + pick(rnd, 6));
}

let tag = 0;

/** A random in-range op on `model`, including inserts that carry restore data. */
function randomOp(rnd: Rnd, model: SheetModel): SheetOp {
  // Only inserts address an empty axis; everything else needs a track to hit.
  const kind = model.rows === 0 || model.cols === 0 ? (rnd() < 0.5 ? 1 : 3) : pick(rnd, 7);
  const t = ++tag;
  switch (kind) {
    case 0: {
      const row = pick(rnd, model.rows);
      const col = pick(rnd, model.cols);
      const h = 1 + pick(rnd, model.rows - row);
      const w = 1 + pick(rnd, model.cols - col);
      const values: string[][] = [];
      for (let r = 0; r < h; r++) {
        // Ragged lines: some rows are shorter than the rectangle.
        const width = rnd() < 0.25 ? pick(rnd, w + 1) : w;
        values.push(Array.from({ length: width }, (_, c) => `s${t}_${r}_${c}`));
      }
      return { kind: 'set-cells', row, col, values };
    }
    case 1: {
      const count = 1 + pick(rnd, 2);
      const at = pick(rnd, model.rows + 1);
      if (rnd() < 0.5) return { kind: 'insert-rows', at, count };
      return {
        kind: 'insert-rows',
        at,
        count,
        cells: Array.from({ length: count * model.cols }, (_, i) => `ir${t}_${i}`),
        heights: Array.from({ length: count }, (_, i) => (i % 2 ? 33 : null)),
      };
    }
    case 2: {
      const at = pick(rnd, model.rows);
      return { kind: 'remove-rows', at, count: 1 + pick(rnd, model.rows - at) };
    }
    case 3: {
      const count = 1 + pick(rnd, 2);
      const at = pick(rnd, model.cols + 1);
      if (rnd() < 0.5) return { kind: 'insert-cols', at, count };
      return {
        kind: 'insert-cols',
        at,
        count,
        cells: Array.from({ length: count * model.rows }, (_, i) => `ic${t}_${i}`),
        widths: Array.from({ length: count }, (_, i) => (i % 2 ? 77 : null)),
      };
    }
    case 4: {
      const at = pick(rnd, model.cols);
      return { kind: 'remove-cols', at, count: 1 + pick(rnd, model.cols - at) };
    }
    case 5:
      return { kind: 'set-col-width', col: pick(rnd, model.cols), width: rnd() < 0.2 ? null : 100 + t };
    default:
      return { kind: 'set-row-height', row: pick(rnd, model.rows), height: rnd() < 0.2 ? null : 10 + t };
  }
}

function randomOps(rnd: Rnd, model: SheetModel, max: number): SheetOp[] {
  const ops: SheetOp[] = [];
  let current = model;
  const n = 1 + pick(rnd, max);
  for (let i = 0; i < n; i++) {
    const op = randomOp(rnd, current);
    ops.push(op);
    current = applySheetOp(current, op).model;
  }
  return ops;
}

const grid = (m: SheetModel) => ({ rows: m.rows, cols: m.cols, cells: m.cells, colWidths: m.colWidths, rowHeights: m.rowHeights });

function expectConverge(base: SheetModel, a: SheetOp[], b: SheetOp[], ctx: string) {
  const { ops: aPrime, against: bPrime } = transformSheetOps(a, b, 'left');
  const viaA = applySheetOps(applySheetOps(base, a).model, bPrime).model;
  const viaB = applySheetOps(applySheetOps(base, b).model, aPrime).model;
  expect(grid(viaA), `${ctx}: divergence\na=${JSON.stringify(a)}\nb=${JSON.stringify(b)}\na'=${JSON.stringify(aPrime)}\nb'=${JSON.stringify(bPrime)}`).toEqual(grid(viaB));
}

describe('transformSheetOp', () => {
  const m = labelled(4, 4);

  it('shifts a set-cells past a concurrent row insert and splits one the insert lands inside', () => {
    const set: SheetOp = { kind: 'set-cells', row: 1, col: 0, values: [['a'], ['b'], ['c']] };
    expect(transformSheetOp(set, { kind: 'insert-rows', at: 1, count: 2 })).toEqual([{ ...set, row: 3 }]);
    expect(transformSheetOp(set, { kind: 'insert-rows', at: 4, count: 2 })).toEqual([set]);
    expect(transformSheetOp(set, { kind: 'insert-rows', at: 2, count: 1 })).toEqual([
      { kind: 'set-cells', row: 1, col: 0, values: [['a']] },
      { kind: 'set-cells', row: 3, col: 0, values: [['b'], ['c']] },
    ]);
  });

  it('clips a set-cells against a concurrent removal and drops it when nothing survives', () => {
    const set: SheetOp = { kind: 'set-cells', row: 0, col: 1, values: [['a', 'b', 'c']] };
    expect(transformSheetOp(set, { kind: 'remove-cols', at: 2, count: 1 })).toEqual([{ kind: 'set-cells', row: 0, col: 1, values: [['a', 'c']] }]);
    expect(transformSheetOp(set, { kind: 'remove-cols', at: 0, count: 2 })).toEqual([{ kind: 'set-cells', row: 0, col: 0, values: [['b', 'c']] }]);
    expect(transformSheetOp(set, { kind: 'remove-cols', at: 1, count: 3 })).toEqual([]);
    expect(transformSheetOp(set, { kind: 'remove-rows', at: 0, count: 1 })).toEqual([]);
  });

  it('lets the left side win an overlapping set-cells', () => {
    const left: SheetOp = { kind: 'set-cells', row: 0, col: 0, values: [['L', 'L']] };
    const right: SheetOp = { kind: 'set-cells', row: 0, col: 1, values: [['R', 'R']] };
    expect(transformSheetOp(left, right, 'left')).toEqual([left]);
    expect(transformSheetOp(right, left, 'right')).toEqual([{ kind: 'set-cells', row: 0, col: 1, values: [['L', 'R']] }]);
  });

  it('orders concurrent inserts at the same index by side', () => {
    const ins: SheetOp = { kind: 'insert-rows', at: 2, count: 1 };
    expect(transformSheetOp(ins, { kind: 'insert-rows', at: 2, count: 3 }, 'left')).toEqual([ins]);
    expect(transformSheetOp(ins, { kind: 'insert-rows', at: 2, count: 3 }, 'right')).toEqual([{ ...ins, at: 5 }]);
  });

  it('splits a removal around rows inserted inside it and subtracts a concurrent removal', () => {
    expect(transformSheetOp({ kind: 'remove-rows', at: 1, count: 3 }, { kind: 'insert-rows', at: 2, count: 2 })).toEqual([
      { kind: 'remove-rows', at: 4, count: 2 },
      { kind: 'remove-rows', at: 1, count: 1 },
    ]);
    expect(transformSheetOp({ kind: 'remove-rows', at: 1, count: 3 }, { kind: 'remove-rows', at: 2, count: 5 })).toEqual([{ kind: 'remove-rows', at: 1, count: 1 }]);
    expect(transformSheetOp({ kind: 'remove-rows', at: 1, count: 1 }, { kind: 'remove-rows', at: 0, count: 3 })).toEqual([]);
  });

  it('moves and drops size ops with their track, and yields a same-track size by side', () => {
    expect(transformSheetOp({ kind: 'set-col-width', col: 2, width: 10 }, { kind: 'insert-cols', at: 1, count: 2 })).toEqual([{ kind: 'set-col-width', col: 4, width: 10 }]);
    expect(transformSheetOp({ kind: 'set-col-width', col: 2, width: 10 }, { kind: 'remove-cols', at: 2, count: 1 })).toEqual([]);
    expect(transformSheetOp({ kind: 'set-row-height', row: 3, height: 10 }, { kind: 'remove-rows', at: 0, count: 2 })).toEqual([{ kind: 'set-row-height', row: 1, height: 10 }]);
    const w: SheetOp = { kind: 'set-col-width', col: 0, width: 10 };
    expect(transformSheetOp(w, { kind: 'set-col-width', col: 0, width: 20 }, 'right')).toEqual([]);
    expect(transformSheetOp(w, { kind: 'set-col-width', col: 0, width: 20 }, 'left')).toEqual([w]);
  });

  it('reshapes restored cells on an insert against a splice on the other axis', () => {
    const undoRows = applySheetOp(m, { kind: 'remove-rows', at: 1, count: 1 }).inverse[0];
    const [reshaped] = transformSheetOp(undoRows, { kind: 'insert-cols', at: 1, count: 1 }) as Extract<SheetOp, { kind: 'insert-rows' }>[];
    expect(reshaped.cells).toEqual(['r1c0', '', 'r1c1', 'r1c2', 'r1c3']);
    const undoCols = applySheetOp(m, { kind: 'remove-cols', at: 0, count: 2 }).inverse[0];
    const [cut] = transformSheetOp(undoCols, { kind: 'remove-rows', at: 0, count: 3 }) as Extract<SheetOp, { kind: 'insert-cols' }>[];
    expect(cut.cells).toEqual(['r3c0', 'r3c1']);
  });
});

describe('sheet op fuzz', () => {
  it('every op inverts exactly (round trip over 600 random ops)', () => {
    for (let seed = 1; seed <= 600 * SCALE; seed++) {
      const rnd = mulberry32(seed);
      const base = randomModel(rnd);
      const ops = randomOps(rnd, base, 4);
      const { model, inverse } = applySheetOps(base, ops);
      expect(grid(applySheetOps(model, inverse).model), `seed ${seed}: inverse of ${JSON.stringify(ops)}`).toEqual(grid(base));
    }
  });

  it('TP1: single op pairs converge across 3000 random pairs', () => {
    let checked = 0;
    for (let seed = 1; seed <= 3000 * SCALE; seed++) {
      const rnd = mulberry32(seed * 7);
      const base = randomModel(rnd);
      const a = randomOp(rnd, base);
      const b = randomOp(rnd, base);
      const ta = transformSheetOp(a, b, 'left');
      const tb = transformSheetOp(b, a, 'right');
      const viaA = applySheetOps(applySheetOp(base, a).model, tb).model;
      const viaB = applySheetOps(applySheetOp(base, b).model, ta).model;
      expect(grid(viaA), `seed ${seed}: TP1 divergence\na=${JSON.stringify(a)}\nb=${JSON.stringify(b)}\na'=${JSON.stringify(ta)}\nb'=${JSON.stringify(tb)}`).toEqual(grid(viaB));
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('sequences converge through transformSheetOps across 1500 random pairs of transactions', () => {
    for (let seed = 1; seed <= 1500 * SCALE; seed++) {
      const rnd = mulberry32(seed * 13);
      const base = randomModel(rnd);
      const a = randomOps(rnd, base, 3);
      const b = randomOps(rnd, base, 3);
      expectConverge(base, a, b, `seed ${seed}`);
    }
  });

  it('rebaseSheetOps over a run of concurrent ops equals the pairwise ladder', () => {
    for (let seed = 1; seed <= 400 * SCALE; seed++) {
      const rnd = mulberry32(seed * 31);
      const base = randomModel(rnd);
      const local = randomOps(rnd, base, 2);
      const remote = randomOps(rnd, base, 3);
      const rebased = rebaseSheetOps(local, remote, 'right');
      const remoteThenLocal = applySheetOps(applySheetOps(base, remote).model, rebased).model;
      const { against: remotePrime } = transformSheetOps(local, remote, 'right');
      const localThenRemote = applySheetOps(applySheetOps(base, local).model, remotePrime).model;
      expect(grid(remoteThenLocal), `seed ${seed}: rebase\nlocal=${JSON.stringify(local)}\nremote=${JSON.stringify(remote)}`).toEqual(grid(localThenRemote));
    }
  });
});
