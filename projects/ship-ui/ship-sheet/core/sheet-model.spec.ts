import { describe, expect, it } from 'vitest';
import {
  SheetModel,
  SheetOp,
  applySheetOp,
  applySheetOps,
  cellAt,
  createSheet,
  normalizedRange,
  primarySheetRange,
  sheetCellSelection,
  sheetFromJSON,
  sheetToJSON,
} from './sheet-model';

function grid(model: SheetModel): string[][] {
  const out: string[][] = [];
  for (let r = 0; r < model.rows; r++) {
    out.push(model.cells.slice(r * model.cols, (r + 1) * model.cols) as string[]);
  }
  return out;
}

function sample(): SheetModel {
  // 3×3: a1..c3 row-major.
  return createSheet(3, 3, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3']);
}

describe('sheet model', () => {
  it('creates an empty grid with size columns', () => {
    const model = createSheet(2, 4);
    expect(model.cells).toHaveLength(8);
    expect(model.cells.every((c) => c === '')).toBe(true);
    expect(model.colWidths).toEqual([null, null, null, null]);
    expect(model.rowHeights).toEqual([null, null]);
  });

  it('cellAt reads row-major and blanks out-of-range', () => {
    const model = sample();
    expect(cellAt(model, 1, 2)).toBe('c2');
    expect(cellAt(model, 3, 0)).toBe('');
    expect(cellAt(model, 0, -1)).toBe('');
  });

  it('normalizedRange sorts corners and clamps', () => {
    const model = sample();
    expect(normalizedRange(model, { r0: 5, c0: 2, r1: 1, c1: -3 })).toEqual({ r0: 1, c0: 0, r1: 2, c1: 2 });
  });

  it('multi-range selection: last range is primary, cell selection is one cell', () => {
    expect(sheetCellSelection(2, 1)).toEqual({ ranges: [{ r0: 2, c0: 1, r1: 2, c1: 1 }] });
    const selection = {
      ranges: [
        { r0: 0, c0: 0, r1: 1, c1: 1 },
        { r0: 2, c0: 2, r1: 2, c1: 2 },
      ],
    };
    expect(primarySheetRange(selection)).toEqual({ r0: 2, c0: 2, r1: 2, c1: 2 });
    expect(primarySheetRange(null)).toBeNull();
    expect(primarySheetRange({ ranges: [] })).toBeNull();
  });
});

describe('sheet ops', () => {
  it('set-cells overwrites a rectangle and inverts to the previous values', () => {
    const model = sample();
    const op: SheetOp = { kind: 'set-cells', row: 1, col: 1, values: [['X', 'Y'], ['Z', 'W']] };
    const { model: next, inverse } = applySheetOp(model, op);
    expect(grid(next)[1]).toEqual(['a2', 'X', 'Y']);
    expect(grid(next)[2]).toEqual(['a3', 'Z', 'W']);
    const { model: undone } = applySheetOps(next, inverse);
    expect(undone.cells).toEqual(model.cells);
  });

  it('set-cells clips values hanging past the edge', () => {
    const model = sample();
    const { model: next } = applySheetOp(model, { kind: 'set-cells', row: 2, col: 2, values: [['X', 'far'], ['gone']] });
    expect(grid(next)[2]).toEqual(['a3', 'b3', 'X']);
    expect(next.rows).toBe(3);
  });

  it('remove-rows inverts to an insert that restores cells and heights', () => {
    const withHeight = applySheetOp(sample(), { kind: 'set-row-height', row: 1, height: 44 }).model;
    const { model: next, inverse } = applySheetOp(withHeight, { kind: 'remove-rows', at: 1, count: 1 });
    expect(next.rows).toBe(2);
    expect(grid(next)).toEqual([
      ['a1', 'b1', 'c1'],
      ['a3', 'b3', 'c3'],
    ]);
    const { model: undone } = applySheetOps(next, inverse);
    expect(undone.cells).toEqual(withHeight.cells);
    expect(undone.rowHeights).toEqual([null, 44, null]);
  });

  it('remove-cols inverts to an insert that restores cells and widths', () => {
    const withWidth = applySheetOp(sample(), { kind: 'set-col-width', col: 1, width: 120 }).model;
    const { model: next, inverse } = applySheetOp(withWidth, { kind: 'remove-cols', at: 1, count: 1 });
    expect(next.cols).toBe(2);
    expect(grid(next)).toEqual([
      ['a1', 'c1'],
      ['a2', 'c2'],
      ['a3', 'c3'],
    ]);
    const { model: undone } = applySheetOps(next, inverse);
    expect(undone.cells).toEqual(withWidth.cells);
    expect(undone.colWidths).toEqual([null, 120, null]);
  });

  it('insert-rows and insert-cols splice empty tracks', () => {
    const model = sample();
    const rows = applySheetOp(model, { kind: 'insert-rows', at: 1, count: 2 }).model;
    expect(rows.rows).toBe(5);
    expect(grid(rows)[1]).toEqual(['', '', '']);
    expect(grid(rows)[3]).toEqual(['a2', 'b2', 'c2']);
    const cols = applySheetOp(model, { kind: 'insert-cols', at: 0, count: 1 }).model;
    expect(cols.cols).toBe(4);
    expect(grid(cols)[0]).toEqual(['', 'a1', 'b1', 'c1']);
    expect(cols.colWidths).toEqual([null, null, null, null]);
  });

  it('a whole op sequence undoes through its inverse', () => {
    const model = sample();
    const { model: next, inverse } = applySheetOps(model, [
      { kind: 'set-cells', row: 0, col: 0, values: [['HEAD']] },
      { kind: 'remove-cols', at: 2, count: 1 },
      { kind: 'insert-rows', at: 0, count: 1 },
      { kind: 'set-col-width', col: 0, width: 200 },
    ]);
    expect(next.cols).toBe(2);
    expect(next.rows).toBe(4);
    const { model: undone } = applySheetOps(next, inverse);
    expect(undone).toEqual(model);
  });

  it('clamps degenerate coordinates instead of throwing', () => {
    const model = sample();
    expect(applySheetOp(model, { kind: 'remove-rows', at: 10, count: 5 }).model).toBe(model);
    expect(applySheetOp(model, { kind: 'insert-rows', at: -2, count: 0 }).model).toBe(model);
    const clamped = applySheetOp(model, { kind: 'remove-rows', at: 2, count: 9 }).model;
    expect(clamped.rows).toBe(2);
  });
});

describe('sheet JSON round-trip', () => {
  it('round-trips through attrs JSON', () => {
    const model = applySheetOps(sample(), [
      { kind: 'set-col-width', col: 2, width: 90 },
      { kind: 'set-row-height', row: 0, height: 28 },
    ]).model;
    const restored = sheetFromJSON(JSON.parse(JSON.stringify(sheetToJSON(model))));
    expect(restored).toEqual(model);
  });

  it('omits all-default size tracks from JSON', () => {
    const json = sheetToJSON(sample());
    expect(json.colWidths).toBeUndefined();
    expect(json.rowHeights).toBeUndefined();
  });

  it('rejects malformed attrs and coerces junk values', () => {
    expect(sheetFromJSON(null)).toBeNull();
    expect(sheetFromJSON({ rows: 2 })).toBeNull();
    expect(sheetFromJSON({ rows: 1e9, cols: 1e9, cells: [] })).toBeNull();
    const model = sheetFromJSON({ rows: 1, cols: 2, cells: [1, null], colWidths: ['x', -5] })!;
    expect(model.cells).toEqual(['1', '']);
    expect(model.colWidths).toEqual([null, null]);
  });
});
