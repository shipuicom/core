// ---------------------------------------------------------------------------
// ShipSheet — Columnar Cell Model
// ---------------------------------------------------------------------------
//
// Third instance of the house pattern: ship-editor's rows are blocks,
// ship-code's rows are lines, here rows × cols are cells. The model is a
// plain immutable value — cell values in one flat row-major column, column
// widths and row heights as their own columns — with no signals anywhere;
// reactivity lives at the view boundary only.
//
// Changes are ops from day one. Every application returns the inverse op
// sequence, the same shape as ship-code's `applyFlatChange`, so a history
// stack — and eventually the editor's collab rebasing — consumes them
// without the model growing a second change representation.

export interface SheetModel {
  readonly rows: number;
  readonly cols: number;
  /** Row-major cell values, `rows * cols` entries; `''` is an empty cell. */
  readonly cells: readonly string[];
  /** Explicit column widths in px, `null` where the default applies. */
  readonly colWidths: readonly (number | null)[];
  /** Explicit row heights in px, `null` where the default applies. */
  readonly rowHeights: readonly (number | null)[];
}

/** A rectangular cell range; corners may arrive in any order. */
export interface SheetRange {
  readonly r0: number;
  readonly c0: number;
  readonly r1: number;
  readonly c1: number;
}

/**
 * A selection is a list of rectangles — the multi-range shape modifier
 * clicks build (Cmd/Ctrl adds a range, Shift moves the active one's head).
 * The last range is the active one, the same primary-range convention as
 * ship-code's `FlatSelection`.
 */
export interface SheetSelection {
  readonly ranges: readonly SheetRange[];
}

/** A single-cell selection at (row, col). */
export function sheetCellSelection(row: number, col: number): SheetSelection {
  return { ranges: [{ r0: row, c0: col, r1: row, c1: col }] };
}

/** The active (last) range, `null` for an empty or missing selection. */
export function primarySheetRange(selection: SheetSelection | null | undefined): SheetRange | null {
  return selection?.ranges[selection.ranges.length - 1] ?? null;
}

export type SheetOp =
  /** Overwrite a rectangle of cell values anchored at (row, col). */
  | { readonly kind: 'set-cells'; readonly row: number; readonly col: number; readonly values: readonly (readonly string[])[] }
  /** Insert `count` rows at `at`; `cells`/`heights` restore removed data on undo. */
  | {
      readonly kind: 'insert-rows';
      readonly at: number;
      readonly count: number;
      readonly cells?: readonly string[];
      readonly heights?: readonly (number | null)[];
    }
  | { readonly kind: 'remove-rows'; readonly at: number; readonly count: number }
  | {
      readonly kind: 'insert-cols';
      readonly at: number;
      readonly count: number;
      readonly cells?: readonly string[];
      readonly widths?: readonly (number | null)[];
    }
  | { readonly kind: 'remove-cols'; readonly at: number; readonly count: number }
  | { readonly kind: 'set-col-width'; readonly col: number; readonly width: number | null }
  | { readonly kind: 'set-row-height'; readonly row: number; readonly height: number | null };

export interface SheetOpResult {
  readonly model: SheetModel;
  /** Ops that undo the applied one, in application order for reverse replay. */
  readonly inverse: readonly SheetOp[];
}

export function createSheet(rows: number, cols: number, cells?: readonly string[]): SheetModel {
  const r = Math.max(0, rows);
  const c = Math.max(0, cols);
  const flat = new Array<string>(r * c).fill('');
  if (cells) for (let i = 0; i < Math.min(cells.length, flat.length); i++) flat[i] = cells[i] ?? '';
  return {
    rows: r,
    cols: c,
    cells: flat,
    colWidths: new Array<number | null>(c).fill(null),
    rowHeights: new Array<number | null>(r).fill(null),
  };
}

export function cellAt(model: SheetModel, row: number, col: number): string {
  if (row < 0 || row >= model.rows || col < 0 || col >= model.cols) return '';
  return model.cells[row * model.cols + col] ?? '';
}

/** The range with corners sorted and clamped into the model's bounds. */
export function normalizedRange(model: SheetModel, range: SheetRange): SheetRange {
  const clampR = (v: number) => Math.max(0, Math.min(v, model.rows - 1));
  const clampC = (v: number) => Math.max(0, Math.min(v, model.cols - 1));
  return {
    r0: clampR(Math.min(range.r0, range.r1)),
    c0: clampC(Math.min(range.c0, range.c1)),
    r1: clampR(Math.max(range.r0, range.r1)),
    c1: clampC(Math.max(range.c0, range.c1)),
  };
}

/** Apply one op. Out-of-range coordinates clamp rather than throw. */
export function applySheetOp(model: SheetModel, op: SheetOp): SheetOpResult {
  switch (op.kind) {
    case 'set-cells':
      return applySetCells(model, op);
    case 'insert-rows':
      return applyInsertRows(model, op.at, op.count, op.cells, op.heights);
    case 'remove-rows':
      return applyRemoveRows(model, op.at, op.count);
    case 'insert-cols':
      return applyInsertCols(model, op.at, op.count, op.cells, op.widths);
    case 'remove-cols':
      return applyRemoveCols(model, op.at, op.count);
    case 'set-col-width': {
      const col = Math.max(0, Math.min(op.col, model.cols - 1));
      if (model.cols === 0) return { model, inverse: [] };
      const colWidths = model.colWidths.slice();
      const inverse: SheetOp = { kind: 'set-col-width', col, width: colWidths[col] };
      colWidths[col] = op.width;
      return { model: { ...model, colWidths }, inverse: [inverse] };
    }
    case 'set-row-height': {
      const row = Math.max(0, Math.min(op.row, model.rows - 1));
      if (model.rows === 0) return { model, inverse: [] };
      const rowHeights = model.rowHeights.slice();
      const inverse: SheetOp = { kind: 'set-row-height', row, height: rowHeights[row] };
      rowHeights[row] = op.height;
      return { model: { ...model, rowHeights }, inverse: [inverse] };
    }
  }
}

/**
 * Apply a sequence of ops. Each op addresses the model as left by the
 * previous one; the returned inverse replays in order to undo the whole
 * sequence — the transaction shape `applyFlatChanges` established.
 */
export function applySheetOps(model: SheetModel, ops: readonly SheetOp[]): SheetOpResult {
  let current = model;
  const inverse: SheetOp[] = [];
  for (const op of ops) {
    const result = applySheetOp(current, op);
    current = result.model;
    inverse.unshift(...result.inverse);
  }
  return { model: current, inverse };
}

function applySetCells(
  model: SheetModel,
  op: { readonly row: number; readonly col: number; readonly values: readonly (readonly string[])[] }
): SheetOpResult {
  if (model.rows === 0 || model.cols === 0 || op.values.length === 0) return { model, inverse: [] };
  const row = Math.max(0, Math.min(op.row, model.rows - 1));
  const col = Math.max(0, Math.min(op.col, model.cols - 1));
  const height = Math.min(op.values.length, model.rows - row);
  const cells = model.cells.slice();
  const previous: string[][] = [];
  for (let r = 0; r < height; r++) {
    const line = op.values[r];
    const width = Math.min(line.length, model.cols - col);
    const before: string[] = [];
    for (let c = 0; c < width; c++) {
      const at = (row + r) * model.cols + (col + c);
      before.push(cells[at]);
      cells[at] = line[c] ?? '';
    }
    previous.push(before);
  }
  return {
    model: { ...model, cells },
    inverse: [{ kind: 'set-cells', row, col, values: previous }],
  };
}

function applyInsertRows(
  model: SheetModel,
  rawAt: number,
  rawCount: number,
  restoreCells?: readonly string[],
  restoreHeights?: readonly (number | null)[]
): SheetOpResult {
  const count = Math.max(0, rawCount);
  if (count === 0) return { model, inverse: [] };
  const at = Math.max(0, Math.min(rawAt, model.rows));
  const inserted = new Array<string>(count * model.cols).fill('');
  if (restoreCells) {
    for (let i = 0; i < Math.min(restoreCells.length, inserted.length); i++) inserted[i] = restoreCells[i] ?? '';
  }
  const cells = [...model.cells.slice(0, at * model.cols), ...inserted, ...model.cells.slice(at * model.cols)];
  const heights = new Array<number | null>(count).fill(null);
  if (restoreHeights) for (let i = 0; i < Math.min(restoreHeights.length, count); i++) heights[i] = restoreHeights[i];
  const rowHeights = [...model.rowHeights.slice(0, at), ...heights, ...model.rowHeights.slice(at)];
  return {
    model: { ...model, rows: model.rows + count, cells, rowHeights },
    inverse: [{ kind: 'remove-rows', at, count }],
  };
}

function applyRemoveRows(model: SheetModel, rawAt: number, rawCount: number): SheetOpResult {
  const at = Math.max(0, Math.min(rawAt, model.rows));
  const count = Math.max(0, Math.min(rawCount, model.rows - at));
  if (count === 0) return { model, inverse: [] };
  const removedCells = model.cells.slice(at * model.cols, (at + count) * model.cols);
  const removedHeights = model.rowHeights.slice(at, at + count);
  const cells = [...model.cells.slice(0, at * model.cols), ...model.cells.slice((at + count) * model.cols)];
  const rowHeights = [...model.rowHeights.slice(0, at), ...model.rowHeights.slice(at + count)];
  return {
    model: { ...model, rows: model.rows - count, cells, rowHeights },
    inverse: [{ kind: 'insert-rows', at, count, cells: removedCells, heights: removedHeights }],
  };
}

function applyInsertCols(
  model: SheetModel,
  rawAt: number,
  rawCount: number,
  restoreCells?: readonly string[],
  restoreWidths?: readonly (number | null)[]
): SheetOpResult {
  const count = Math.max(0, rawCount);
  if (count === 0) return { model, inverse: [] };
  const at = Math.max(0, Math.min(rawAt, model.cols));
  const cols = model.cols + count;
  const cells = new Array<string>(model.rows * cols).fill('');
  for (let r = 0; r < model.rows; r++) {
    for (let c = 0; c < model.cols; c++) {
      cells[r * cols + (c < at ? c : c + count)] = model.cells[r * model.cols + c];
    }
    if (restoreCells) {
      // Restored column data arrives column-major: count columns × rows cells.
      for (let c = 0; c < count; c++) {
        const value = restoreCells[c * model.rows + r];
        if (value !== undefined) cells[r * cols + at + c] = value;
      }
    }
  }
  const widths = new Array<number | null>(count).fill(null);
  if (restoreWidths) for (let i = 0; i < Math.min(restoreWidths.length, count); i++) widths[i] = restoreWidths[i];
  const colWidths = [...model.colWidths.slice(0, at), ...widths, ...model.colWidths.slice(at)];
  return {
    model: { ...model, cols, cells, colWidths },
    inverse: [{ kind: 'remove-cols', at, count }],
  };
}

function applyRemoveCols(model: SheetModel, rawAt: number, rawCount: number): SheetOpResult {
  const at = Math.max(0, Math.min(rawAt, model.cols));
  const count = Math.max(0, Math.min(rawCount, model.cols - at));
  if (count === 0) return { model, inverse: [] };
  const cols = model.cols - count;
  const cells = new Array<string>(model.rows * cols).fill('');
  const removed = new Array<string>(model.rows * count).fill('');
  for (let r = 0; r < model.rows; r++) {
    for (let c = 0; c < model.cols; c++) {
      const value = model.cells[r * model.cols + c];
      if (c < at) cells[r * cols + c] = value;
      else if (c < at + count) removed[(c - at) * model.rows + r] = value;
      else cells[r * cols + (c - count)] = value;
    }
  }
  const removedWidths = model.colWidths.slice(at, at + count);
  const colWidths = [...model.colWidths.slice(0, at), ...model.colWidths.slice(at + count)];
  return {
    model: { ...model, cols, cells, colWidths },
    inverse: [{ kind: 'insert-cols', at, count, cells: removed, widths: removedWidths }],
  };
}

// ---------------------------------------------------------------------------
// JSON round-trip — the block-attrs persistence shape
// ---------------------------------------------------------------------------

/** The JSON persisted into a sheet block's attrs. */
export interface SheetJSON {
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly string[];
  readonly colWidths?: readonly (number | null)[];
  readonly rowHeights?: readonly (number | null)[];
}

export function sheetToJSON(model: SheetModel): SheetJSON {
  const json: { -readonly [K in keyof SheetJSON]: SheetJSON[K] } = {
    rows: model.rows,
    cols: model.cols,
    cells: model.cells,
  };
  if (model.colWidths.some((w) => w !== null)) json.colWidths = model.colWidths;
  if (model.rowHeights.some((h) => h !== null)) json.rowHeights = model.rowHeights;
  return json;
}

/** Rebuild a model from untrusted attrs JSON; malformed input yields `null`. */
export function sheetFromJSON(value: unknown): SheetModel | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const rows = typeof raw['rows'] === 'number' && Number.isInteger(raw['rows']) ? raw['rows'] : NaN;
  const cols = typeof raw['cols'] === 'number' && Number.isInteger(raw['cols']) ? raw['cols'] : NaN;
  if (!(rows >= 0) || !(cols >= 0) || rows * cols > 1_000_000) return null;
  const rawCells = Array.isArray(raw['cells']) ? raw['cells'] : [];
  const cells = new Array<string>(rows * cols).fill('');
  for (let i = 0; i < Math.min(rawCells.length, cells.length); i++) {
    const v = rawCells[i];
    cells[i] = typeof v === 'string' ? v : v == null ? '' : String(v);
  }
  const size = (raw: unknown, n: number): (number | null)[] => {
    const out = new Array<number | null>(n).fill(null);
    if (!Array.isArray(raw)) return out;
    for (let i = 0; i < Math.min(raw.length, n); i++) {
      const v = raw[i];
      out[i] = typeof v === 'number' && v > 0 && v <= 10_000 ? v : null;
    }
    return out;
  };
  return { rows, cols, cells, colWidths: size(raw['colWidths'], cols), rowHeights: size(raw['rowHeights'], rows) };
}
