// ---------------------------------------------------------------------------
// ShipSpreadsheet — formulas: grammar, evaluator, dependency graph
// ---------------------------------------------------------------------------
//
// A formula is any cell whose text starts with `=`. Nothing here touches the
// model, the ops or the transform: evaluation is derived state the
// `SheetEvaluator` keeps beside the model and refreshes incrementally from
// the ops that changed it. See FORMULAS.md for the design; this is its
// first step (the pure core), not yet wired into the composer.

import { SheetModel, SheetOp } from './sheet-model';

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

export type FormulaErrorCode = '#CYCLE' | '#REF!' | '#NAME?' | '#DIV/0!' | '#VALUE!' | '#ERROR!';
export interface FormulaError {
  readonly error: FormulaErrorCode;
}
/** `null` is an empty cell. */
export type FormulaValue = number | string | boolean | null | FormulaError;

const err = (error: FormulaErrorCode): FormulaError => ({ error });
export const isFormulaError = (v: FormulaValue): v is FormulaError => typeof v === 'object' && v !== null;

/** Whether a raw cell string is a formula. */
export const isFormula = (raw: string): boolean => raw.length > 1 && raw[0] === '=';

/** The displayed form of a value: numbers without float noise, booleans upper-case, errors as codes. */
export function formatFormulaValue(value: FormulaValue): string {
  if (value === null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(Number(value.toPrecision(15))) : '#VALUE!';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'string') return value;
  return value.error;
}

/** A non-formula cell's value: blank is empty, a number literal is a number, else text. */
export function cellValueOf(raw: string): FormulaValue {
  if (raw === '') return null;
  if (/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(raw)) return Number(raw);
  if (raw === 'TRUE') return true;
  if (raw === 'FALSE') return false;
  return raw;
}

// ---------------------------------------------------------------------------
// Column letters
// ---------------------------------------------------------------------------

export function formulaColLabel(col: number): string {
  let s = '';
  let n = col + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function formulaColIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

// ---------------------------------------------------------------------------
// Grammar
// ---------------------------------------------------------------------------

export interface FormulaRef {
  readonly row: number;
  readonly col: number;
  readonly absRow: boolean;
  readonly absCol: boolean;
}

export type FormulaNode =
  | { readonly t: 'num'; readonly v: number }
  | { readonly t: 'str'; readonly v: string }
  | { readonly t: 'bool'; readonly v: boolean }
  | { readonly t: 'err'; readonly v: FormulaErrorCode }
  | { readonly t: 'ref'; readonly ref: FormulaRef }
  | { readonly t: 'range'; readonly from: FormulaRef; readonly to: FormulaRef }
  | { readonly t: 'neg'; readonly e: FormulaNode }
  | { readonly t: 'bin'; readonly op: string; readonly l: FormulaNode; readonly r: FormulaNode }
  | { readonly t: 'call'; readonly name: string; readonly args: readonly FormulaNode[] };

type Token =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'ref'; ref: FormulaRef }
  | { k: 'id'; v: string }
  | { k: 'err'; v: FormulaErrorCode }
  | { k: 'op'; v: string }
  | { k: 'end' };

const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![A-Za-z0-9_])/;
const ERR_RE = /^#(CYCLE|REF!|NAME\?|DIV\/0!|VALUE!|ERROR!)/;

function tokenize(source: string): Token[] | null {
  const out: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }
    const rest = source.slice(i);
    let m: RegExpExecArray | null;
    if ((m = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(rest))) {
      out.push({ k: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (ch === '"') {
      let j = i + 1;
      let s = '';
      for (; j < source.length; j++) {
        if (source[j] === '"') {
          if (source[j + 1] === '"') {
            s += '"';
            j++;
          } else break;
        } else s += source[j];
      }
      if (j >= source.length) return null;
      out.push({ k: 'str', v: s });
      i = j + 1;
    } else if ((m = ERR_RE.exec(rest))) {
      out.push({ k: 'err', v: `#${m[1]}` as FormulaErrorCode });
      i += m[0].length;
    } else if ((m = REF_RE.exec(rest))) {
      out.push({ k: 'ref', ref: { row: Number(m[4]) - 1, col: formulaColIndex(m[2]), absRow: m[3] === '$', absCol: m[1] === '$' } });
      i += m[0].length;
    } else if ((m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest))) {
      out.push({ k: 'id', v: m[0].toUpperCase() });
      i += m[0].length;
    } else if ((m = /^(<=|>=|<>|[-+*/^&=<>(),:;%])/.exec(rest))) {
      out.push({ k: 'op', v: m[0] });
      i += m[0].length;
    } else return null;
  }
  out.push({ k: 'end' });
  return out;
}

/** Parse the text after `=`; `null` for a syntax error. */
export function parseFormula(source: string): FormulaNode | null {
  const tokens = tokenize(source.startsWith('=') ? source.slice(1) : source);
  if (!tokens) return null;
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => tokens[pos].k === 'op' && (tokens[pos] as { v: string }).v === v;
  const take = () => tokens[pos++];

  function primary(): FormulaNode | null {
    const tok = take();
    switch (tok.k) {
      case 'num':
        return { t: 'num', v: tok.v };
      case 'str':
        return { t: 'str', v: tok.v };
      case 'err':
        return { t: 'err', v: tok.v };
      case 'ref': {
        if (isOp(':')) {
          take();
          const to = take();
          if (to.k !== 'ref') return null;
          return { t: 'range', from: tok.ref, to: to.ref };
        }
        return { t: 'ref', ref: tok.ref };
      }
      case 'id': {
        if (tok.v === 'TRUE') return { t: 'bool', v: true };
        if (tok.v === 'FALSE') return { t: 'bool', v: false };
        if (!isOp('(')) return { t: 'call', name: tok.v, args: [] };
        take();
        const args: FormulaNode[] = [];
        if (!isOp(')')) {
          for (;;) {
            const arg = expr(0);
            if (!arg) return null;
            args.push(arg);
            if (isOp(',') || isOp(';')) {
              take();
              continue;
            }
            break;
          }
        }
        if (!isOp(')')) return null;
        take();
        return { t: 'call', name: tok.v, args };
      }
      case 'op':
        if (tok.v === '(') {
          const e = expr(0);
          if (!e || !isOp(')')) return null;
          take();
          return e;
        }
        if (tok.v === '-') {
          const e = unary();
          return e && { t: 'neg', e };
        }
        if (tok.v === '+') return unary();
        return null;
      default:
        return null;
    }
  }

  function unary(): FormulaNode | null {
    let e = primary();
    while (e && isOp('%')) {
      take();
      e = { t: 'bin', op: '/', l: e, r: { t: 'num', v: 100 } };
    }
    return e;
  }

  const PREC: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };

  function expr(minPrec: number): FormulaNode | null {
    let left = unary();
    while (left) {
      const tok = peek();
      if (tok.k !== 'op' || !(tok.v in PREC) || PREC[tok.v] < minPrec) break;
      take();
      const prec = PREC[tok.v];
      const right = expr(tok.v === '^' ? prec : prec + 1);
      if (!right) return null;
      left = { t: 'bin', op: tok.v, l: left, r: right };
    }
    return left;
  }

  const ast = expr(0);
  return ast && peek().k === 'end' ? ast : null;
}

// ---------------------------------------------------------------------------
// Reference rewriting on structural ops
// ---------------------------------------------------------------------------

const refText = (r: FormulaRef): string => `${r.absCol ? '$' : ''}${formulaColLabel(r.col)}${r.absRow ? '$' : ''}${r.row + 1}`;

/** Shift one axis of a reference across an insert or removal; `null` when it was removed. */
function shiftAxis(index: number, op: { kind: 'insert' | 'remove'; at: number; count: number }): number | null {
  if (op.kind === 'insert') return index >= op.at ? index + op.count : index;
  if (index < op.at) return index;
  if (index < op.at + op.count) return null;
  return index - op.count;
}

/**
 * Rewrite the references in a formula's source for a structural op so
 * they keep pointing at the same cells: `=A5` becomes `=A6` when a row is
 * inserted above 5; a reference into a removed band becomes `#REF!`; a
 * range that overlaps a removed band shrinks. Other ops return the source
 * unchanged. Pure text-level, so it can run inside `applySheetOp` later.
 */
export function rewriteFormulaRefs(source: string, op: SheetOp): string {
  if (!isFormula(source)) return source;
  let axis: 'row' | 'col';
  let splice: { kind: 'insert' | 'remove'; at: number; count: number };
  switch (op.kind) {
    case 'insert-rows':
      axis = 'row';
      splice = { kind: 'insert', at: op.at, count: op.count };
      break;
    case 'remove-rows':
      axis = 'row';
      splice = { kind: 'remove', at: op.at, count: op.count };
      break;
    case 'insert-cols':
      axis = 'col';
      splice = { kind: 'insert', at: op.at, count: op.count };
      break;
    case 'remove-cols':
      axis = 'col';
      splice = { kind: 'remove', at: op.at, count: op.count };
      break;
    default:
      return source;
  }
  const shift = (r: FormulaRef): FormulaRef | null => {
    const next = shiftAxis(r[axis], splice);
    return next === null ? null : { ...r, [axis]: next };
  };
  // Walk the text: string literals are copied, references rewritten.
  let out = '=';
  let i = 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < source.length && !(source[j] === '"' && source[j + 1] !== '"')) j += source[j] === '"' ? 2 : 1;
      out += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    const rest = source.slice(i);
    const m = REF_RE.exec(rest);
    const before = i === 0 ? '' : source[i - 1];
    if (m && !/[A-Za-z0-9_$.]/.test(before)) {
      const ref: FormulaRef = { row: Number(m[4]) - 1, col: formulaColIndex(m[2]), absRow: m[3] === '$', absCol: m[1] === '$' };
      i += m[0].length;
      const colon = /^\s*:\s*/.exec(source.slice(i));
      const m2 = colon ? REF_RE.exec(source.slice(i + colon[0].length)) : null;
      if (colon && m2) {
        i += colon[0].length + m2[0].length;
        const to: FormulaRef = { row: Number(m2[4]) - 1, col: formulaColIndex(m2[2]), absRow: m2[3] === '$', absCol: m2[1] === '$' };
        const lo = Math.min(ref[axis], to[axis]);
        const hi = Math.max(ref[axis], to[axis]);
        let nlo: number | null;
        let nhi: number | null;
        if (splice.kind === 'insert') {
          nlo = shiftAxis(lo, splice);
          // An insert inside the range grows it; at its start moves it.
          nhi = hi >= splice.at ? hi + splice.count : hi;
        } else {
          const end = splice.at + splice.count;
          if (lo >= splice.at && hi < end) {
            nlo = nhi = null;
          } else {
            nlo = lo < splice.at ? lo : lo < end ? splice.at : lo - splice.count;
            nhi = hi < splice.at ? hi : hi < end ? splice.at - 1 : hi - splice.count;
          }
        }
        if (nlo === null || nhi === null) out += '#REF!';
        else {
          const a = { ...ref, [axis]: ref[axis] <= to[axis] ? nlo : nhi };
          const b = { ...to, [axis]: ref[axis] <= to[axis] ? nhi : nlo };
          out += `${refText(a)}:${refText(b)}`;
        }
        continue;
      }
      const next = shift(ref);
      out += next ? refText(next) : '#REF!';
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/** Ranges over more cells than this register on the sheet as a whole rather than per cell. */
const RANGE_DEP_CAP = 10_000;

type Args = FormulaValue[];

function toNumber(v: FormulaValue): number | FormulaError {
  if (v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const n = cellValueOf(v.trim());
    return typeof n === 'number' ? n : err('#VALUE!');
  }
  return v;
}

function toText(v: FormulaValue): string | FormulaError {
  return isFormulaError(v) ? v : formatFormulaValue(v);
}

/** Numbers among the (flattened) arguments; text and blanks are skipped as in spreadsheets. */
function numbers(args: Args): number[] | FormulaError {
  const out: number[] = [];
  for (const v of args) {
    if (isFormulaError(v)) return v;
    if (typeof v === 'number') out.push(v);
    else if (typeof v === 'boolean') out.push(v ? 1 : 0);
  }
  return out;
}

type Fn = (args: Args) => FormulaValue;
const withNumbers = (f: (ns: number[]) => FormulaValue): Fn => (args) => {
  const ns = numbers(args);
  return Array.isArray(ns) ? f(ns) : ns;
};

const FUNCTIONS: Record<string, Fn> = {
  SUM: withNumbers((ns) => ns.reduce((a, b) => a + b, 0)),
  AVG: withNumbers((ns) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : err('#DIV/0!'))),
  MIN: withNumbers((ns) => (ns.length ? Math.min(...ns) : 0)),
  MAX: withNumbers((ns) => (ns.length ? Math.max(...ns) : 0)),
  COUNT: withNumbers((ns) => ns.length),
  COUNTA: (args) => args.filter((v) => v !== null).length,
  ABS: (args) => {
    const n = toNumber(args[0] ?? null);
    return typeof n === 'number' ? Math.abs(n) : n;
  },
  ROUND: (args) => {
    const n = toNumber(args[0] ?? null);
    const d = toNumber(args[1] ?? 0);
    if (typeof n !== 'number') return n;
    if (typeof d !== 'number') return d;
    const f = 10 ** Math.trunc(d);
    return Math.round(n * f) / f;
  },
  IF: (args) => {
    const c = args[0] ?? null;
    if (isFormulaError(c)) return c;
    const truthy = typeof c === 'string' ? c !== '' : !!c;
    return truthy ? (args[1] ?? true) : (args[2] ?? false);
  },
  CONCAT: (args) => {
    let s = '';
    for (const v of args) {
      const t = toText(v);
      if (typeof t !== 'string') return t;
      s += t;
    }
    return s;
  },
  LEN: (args) => {
    const t = toText(args[0] ?? null);
    return typeof t === 'string' ? t.length : t;
  },
  TODAY: () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
};
FUNCTIONS['AVERAGE'] = FUNCTIONS['AVG'];

function binary(op: string, l: FormulaValue, r: FormulaValue): FormulaValue {
  if (isFormulaError(l)) return l;
  if (isFormulaError(r)) return r;
  switch (op) {
    case '&': {
      const a = toText(l);
      const b = toText(r);
      return typeof a === 'string' && typeof b === 'string' ? a + b : err('#VALUE!');
    }
    case '=':
    case '<>':
    case '<':
    case '>':
    case '<=':
    case '>=': {
      const a = typeof l === 'string' ? l.toLowerCase() : (l ?? 0);
      const b = typeof r === 'string' ? r.toLowerCase() : (r ?? 0);
      if (typeof a !== typeof b) return op === '<>' ? true : op === '=' ? false : err('#VALUE!');
      const cmp = a < b ? -1 : a > b ? 1 : 0;
      return op === '=' ? cmp === 0 : op === '<>' ? cmp !== 0 : op === '<' ? cmp < 0 : op === '>' ? cmp > 0 : op === '<=' ? cmp <= 0 : cmp >= 0;
    }
  }
  const a = toNumber(l);
  const b = toNumber(r);
  if (typeof a !== 'number') return a;
  if (typeof b !== 'number') return b;
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? err('#DIV/0!') : a / b;
    case '^':
      return a ** b;
  }
  return err('#ERROR!');
}

/**
 * Evaluates the formulas of a sheet and keeps the result current across
 * ops. Values are derived state: the model is never written. `update`
 * with the ops that produced the new model recomputes only the formulas
 * whose inputs changed (transitively); without ops — a loaded document, a
 * structural op — everything is recomputed once.
 */
export class SheetEvaluator {
  #model: SheetModel | null = null;
  /** Parsed formula per cell index (`null`: syntax error). */
  #ast = new Map<number, FormulaNode | null>();
  #deps = new Map<number, Set<number>>();
  #dependents = new Map<number, Set<number>>();
  /** Formulas whose ranges are too large to track per cell: dirty on any change. */
  #wide = new Set<number>();
  #values = new Map<number, FormulaValue>();
  #visiting = new Set<number>();
  /** Set when an evaluation runs into a cell that is still being evaluated. */
  #cycleHit = false;

  /** The model as last seen. */
  get model(): SheetModel | null {
    return this.#model;
  }

  /** Bring the evaluator up to `model`; `ops` are what turned the previous model into it. */
  update(model: SheetModel, ops?: readonly SheetOp[]): void {
    const previous = this.#model;
    this.#model = model;
    const incremental = previous !== null && ops !== undefined && previous.rows === model.rows && previous.cols === model.cols && ops.every((op) => op.kind === 'set-cells');
    if (!incremental) {
      this.#rebuild();
      return;
    }
    const changed = new Set<number>();
    for (const op of ops) {
      if (op.kind !== 'set-cells') continue;
      for (let r = 0; r < op.values.length; r++) {
        const row = op.row + r;
        if (row >= model.rows) break;
        for (let c = 0; c < op.values[r].length; c++) {
          const col = op.col + c;
          if (col >= model.cols) break;
          changed.add(row * model.cols + col);
        }
      }
    }
    for (const index of changed) this.#index(index, model.cells[index]);
    this.#recompute(changed);
  }

  /** Displayed value of a cell — the raw string for non-formula cells. */
  valueAt(row: number, col: number): string {
    const model = this.#model;
    if (!model || row < 0 || col < 0 || row >= model.rows || col >= model.cols) return '';
    const index = row * model.cols + col;
    const raw = model.cells[index];
    return this.#ast.has(index) ? formatFormulaValue(this.#values.get(index) ?? null) : raw;
  }

  /** The error a formula cell shows, or null. */
  errorAt(row: number, col: number): FormulaErrorCode | null {
    const model = this.#model;
    if (!model) return null;
    const v = this.#values.get(row * model.cols + col);
    return v !== undefined && isFormulaError(v) ? v.error : null;
  }

  /** Whether the cell holds a formula. */
  isFormulaAt(row: number, col: number): boolean {
    const model = this.#model;
    return !!model && this.#ast.has(row * model.cols + col);
  }

  /** Every formula cell index. */
  formulaCells(): number[] {
    return [...this.#ast.keys()];
  }

  #rebuild(): void {
    this.#ast.clear();
    this.#deps.clear();
    this.#dependents.clear();
    this.#wide.clear();
    this.#values.clear();
    const model = this.#model!;
    const cells = model.cells;
    for (let i = 0; i < cells.length; i++) if (isFormula(cells[i])) this.#index(i, cells[i]);
    this.#recompute(new Set(this.#ast.keys()));
  }

  /** (Re)parse one cell and rewire its dependencies. */
  #index(index: number, raw: string): void {
    const old = this.#deps.get(index);
    if (old) {
      for (const d of old) this.#dependents.get(d)?.delete(index);
      this.#deps.delete(index);
    }
    this.#wide.delete(index);
    this.#values.delete(index);
    if (!isFormula(raw)) {
      this.#ast.delete(index);
      return;
    }
    const ast = parseFormula(raw);
    this.#ast.set(index, ast);
    if (!ast) return;
    const deps = new Set<number>();
    const model = this.#model!;
    const visit = (node: FormulaNode): void => {
      switch (node.t) {
        case 'ref':
          if (node.ref.row < model.rows && node.ref.col < model.cols) deps.add(node.ref.row * model.cols + node.ref.col);
          return;
        case 'range': {
          const r0 = Math.min(node.from.row, node.to.row);
          const r1 = Math.min(Math.max(node.from.row, node.to.row), model.rows - 1);
          const c0 = Math.min(node.from.col, node.to.col);
          const c1 = Math.min(Math.max(node.from.col, node.to.col), model.cols - 1);
          if ((r1 - r0 + 1) * (c1 - c0 + 1) > RANGE_DEP_CAP) {
            this.#wide.add(index);
            return;
          }
          for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) deps.add(r * model.cols + c);
          return;
        }
        case 'neg':
          return visit(node.e);
        case 'bin':
          visit(node.l);
          visit(node.r);
          return;
        case 'call':
          node.args.forEach(visit);
          return;
        default:
          return;
      }
    };
    visit(ast);
    this.#deps.set(index, deps);
    for (const d of deps) {
      let set = this.#dependents.get(d);
      if (!set) this.#dependents.set(d, (set = new Set()));
      set.add(index);
    }
  }

  /** Recompute the formulas among `changed` and everything that depends on them, transitively. */
  #recompute(changed: Set<number>): void {
    const dirty = new Set<number>();
    const stack = [...changed];
    while (stack.length) {
      const i = stack.pop()!;
      if (this.#ast.has(i) && !dirty.has(i)) dirty.add(i);
      const deps = this.#dependents.get(i);
      if (deps) for (const d of deps) if (!dirty.has(d)) stack.push(d);
      if (this.#wide.size) for (const w of this.#wide) if (!dirty.has(w)) stack.push(w);
    }
    for (const i of dirty) this.#values.delete(i);
    this.#visiting.clear();
    this.#cycleHit = false;
    for (const i of dirty) this.#evaluate(i);
  }

  #evaluate(index: number): FormulaValue {
    const cached = this.#values.get(index);
    if (cached !== undefined) return cached;
    if (this.#visiting.has(index)) {
      this.#cycleHit = true;
      return err('#CYCLE');
    }
    const ast = this.#ast.get(index);
    if (ast === undefined) return cellValueOf(this.#model!.cells[index]);
    if (ast === null) {
      this.#values.set(index, err('#ERROR!'));
      return err('#ERROR!');
    }
    this.#visiting.add(index);
    const outer = this.#cycleHit;
    this.#cycleHit = false;
    let value = this.#eval(ast);
    this.#visiting.delete(index);
    // Cycles are structural: a cell whose evaluation ran into one — it is on
    // the cycle or downstream of it — shows #CYCLE whatever else its
    // inputs held, so the origin is visible from any endpoint.
    if (this.#cycleHit) value = err('#CYCLE');
    this.#cycleHit = outer || this.#cycleHit;
    this.#values.set(index, value);
    return value;
  }

  #cell(row: number, col: number): FormulaValue {
    const model = this.#model!;
    if (row < 0 || col < 0 || row >= model.rows || col >= model.cols) return err('#REF!');
    return this.#evaluate(row * model.cols + col);
  }

  #eval(node: FormulaNode): FormulaValue {
    switch (node.t) {
      case 'num':
      case 'str':
      case 'bool':
        return node.v;
      case 'err':
        return err(node.v);
      case 'ref':
        return this.#cell(node.ref.row, node.ref.col);
      case 'range':
        return err('#VALUE!');
      case 'neg': {
        const n = toNumber(this.#eval(node.e));
        return typeof n === 'number' ? -n : n;
      }
      case 'bin':
        return binary(node.op, this.#eval(node.l), this.#eval(node.r));
      case 'call': {
        const fn = FUNCTIONS[node.name];
        if (!fn) return err('#NAME?');
        const args: Args = [];
        for (const arg of node.args) {
          if (arg.t === 'range') {
            const model = this.#model!;
            const r0 = Math.min(arg.from.row, arg.to.row);
            const r1 = Math.min(Math.max(arg.from.row, arg.to.row), model.rows - 1);
            const c0 = Math.min(arg.from.col, arg.to.col);
            const c1 = Math.min(Math.max(arg.from.col, arg.to.col), model.cols - 1);
            for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) args.push(this.#cell(r, c));
          } else args.push(this.#eval(arg));
        }
        return fn(args);
      }
    }
  }
}
