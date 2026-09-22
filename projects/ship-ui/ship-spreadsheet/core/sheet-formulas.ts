// ---------------------------------------------------------------------------
// ShipSpreadsheet — formulas: grammar, evaluator, dependency graph
// ---------------------------------------------------------------------------
//
// A formula is any cell whose text starts with `=`. Nothing here touches the
// model, the ops or the transform: evaluation is derived state the
// `SheetEvaluator` keeps beside the model and refreshes incrementally from
// the ops that changed it. See FORMULAS.md for the design; this is its
// first step (the pure core), not yet wired into the composer.

import type { SheetModel, SheetOp } from './sheet-model';

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

export type FormulaErrorCode = '#CYCLE' | '#REF!' | '#NAME?' | '#DIV/0!' | '#VALUE!' | '#ERROR!';
export interface FormulaError {
  readonly error: FormulaErrorCode;
  /** What went wrong, when known: the message of an error a function threw, an arity mismatch. */
  readonly message?: string;
}
/** `null` is an empty cell. */
export type FormulaValue = number | string | boolean | null | FormulaError;
/** What a function receives and returns. */
export type SheetValue = FormulaValue;

const err = (error: FormulaErrorCode, message?: string): FormulaError =>
  message === undefined ? { error } : { error, message };
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
  /** The sheet the reference points into (`Sheet2!A1`); absent for the formula's own sheet. */
  readonly sheet?: string;
}

export type FormulaNode =
  | { readonly t: 'num'; readonly v: number }
  | { readonly t: 'str'; readonly v: string }
  | { readonly t: 'bool'; readonly v: boolean }
  | { readonly t: 'err'; readonly v: FormulaErrorCode }
  | { readonly t: 'ref'; readonly ref: FormulaRef }
  /** `from.sheet` names the sheet of the whole range. */
  | { readonly t: 'range'; readonly from: FormulaRef; readonly to: FormulaRef }
  /** A named column of another sheet (`Tasks!Title`): a range the workbook resolves by header. */
  | { readonly t: 'column'; readonly sheet: string; readonly name: string }
  | { readonly t: 'neg'; readonly e: FormulaNode }
  | { readonly t: 'bin'; readonly op: string; readonly l: FormulaNode; readonly r: FormulaNode }
  | { readonly t: 'call'; readonly name: string; readonly args: readonly FormulaNode[] };

type Token =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'ref'; ref: FormulaRef }
  | { k: 'col'; sheet: string; name: string }
  | { k: 'id'; v: string }
  | { k: 'err'; v: FormulaErrorCode }
  | { k: 'op'; v: string }
  | { k: 'end' };

const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![A-Za-z0-9_])/;
/** A sheet prefix: a bare name or a quoted one (`'` doubled inside), then `!`. */
const SHEET_RE = /^(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_]*))!/;
/** A column name after a sheet prefix: bare or quoted. */
const NAME_RE = /^(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_]*))(?![A-Za-z0-9_(])/;
/** A reference-shaped word followed by `(` is a function call (`LOG10(`, `ATAN2(`), not a reference. */
const CALL_AFTER_RE = /^\s*\(/;
const ERR_RE = /^#(CYCLE|REF!|NAME\?|DIV\/0!|VALUE!|ERROR!)/;

const unquote = (quoted: string | undefined, bare: string | undefined): string =>
  quoted !== undefined ? quoted.replace(/''/g, "'") : (bare ?? '');

/** A sheet or column name as formula text: bare when it is identifier-shaped, quoted otherwise. */
export function formulaNameText(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`;
}

const refOf = (m: RegExpExecArray, sheet?: string): FormulaRef => {
  const ref: FormulaRef = { row: Number(m[4]) - 1, col: formulaColIndex(m[2]), absRow: m[3] === '$', absCol: m[1] === '$' };
  return sheet === undefined ? ref : { ...ref, sheet };
};

const sameSheet = (a: string | undefined, b: string | undefined): boolean =>
  (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

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
    } else if ((m = SHEET_RE.exec(rest))) {
      const sheet = unquote(m[1], m[2]);
      const after = rest.slice(m[0].length);
      const ref = REF_RE.exec(after);
      const name = ref && !CALL_AFTER_RE.test(after.slice(ref[0].length)) ? null : NAME_RE.exec(after);
      if (ref && name === null) {
        out.push({ k: 'ref', ref: refOf(ref, sheet) });
        i += m[0].length + ref[0].length;
      } else if (name) {
        out.push({ k: 'col', sheet, name: unquote(name[1], name[2]) });
        i += m[0].length + name[0].length;
      } else return null;
    } else if ((m = REF_RE.exec(rest)) && !CALL_AFTER_RE.test(rest.slice(m[0].length))) {
      out.push({ k: 'ref', ref: refOf(m) });
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
          if (to.k !== 'ref' || (to.ref.sheet !== undefined && !sameSheet(to.ref.sheet, tok.ref.sheet))) return null;
          const { sheet: _, ...end } = to.ref;
          return { t: 'range', from: tok.ref, to: end };
        }
        return { t: 'ref', ref: tok.ref };
      }
      case 'col':
        return { t: 'column', sheet: tok.sheet, name: tok.name };
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

  const PREC: Record<string, number> = {
    '=': 1,
    '<>': 1,
    '<': 1,
    '>': 1,
    '<=': 1,
    '>=': 1,
    '&': 2,
    '+': 3,
    '-': 3,
    '*': 4,
    '/': 4,
    '^': 5,
  };

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

const refText = (r: FormulaRef): string =>
  `${r.absCol ? '$' : ''}${formulaColLabel(r.col)}${r.absRow ? '$' : ''}${r.row + 1}`;

/** Shift one axis of a reference across an insert or removal; `null` when it was removed. */
function shiftAxis(index: number, op: { kind: 'insert' | 'remove'; at: number; count: number }): number | null {
  if (op.kind === 'insert') return index >= op.at ? index + op.count : index;
  if (index < op.at) return index;
  if (index < op.at + op.count) return null;
  return index - op.count;
}

/** One reference or range met while walking a formula's text; `sheet` is `null` for the own sheet. */
interface RefMatch {
  readonly sheet: string | null;
  /** The sheet prefix as written (`'Budget 2026'!`), empty without one. */
  readonly prefix: string;
  readonly from: FormulaRef;
  readonly to: FormulaRef | null;
}

/**
 * Walk a formula's text: string literals are copied, every reference or
 * range (with its sheet prefix, when any) is handed to `map`, which returns
 * its replacement text or `null` to keep it as written; named columns
 * (`Tasks!Title`) go to `column` the same way. Text-level, no full parse.
 */
function mapFormulaRefs(
  source: string,
  map: (match: RefMatch) => string | null,
  column?: (sheet: string, name: string) => string | null
): string {
  if (!isFormula(source)) return source;
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
    const before = source[i - 1];
    if (!/[A-Za-z0-9_$.]/.test(before)) {
      const sm = SHEET_RE.exec(rest);
      const prefix = sm ? sm[0] : '';
      const sheet = sm ? unquote(sm[1], sm[2]) : null;
      const after = rest.slice(prefix.length);
      const m = REF_RE.exec(after);
      if (m && !CALL_AFTER_RE.test(after.slice(m[0].length))) {
        let consumed = prefix.length + m[0].length;
        const colon = /^\s*:\s*/.exec(after.slice(m[0].length));
        const m2 = colon ? REF_RE.exec(after.slice(m[0].length + colon[0].length)) : null;
        const to = colon && m2 ? refOf(m2) : null;
        if (colon && m2) consumed += colon[0].length + m2[0].length;
        const replacement = map({ sheet, prefix, from: refOf(m), to });
        out += replacement ?? source.slice(i, i + consumed);
        i += consumed;
        continue;
      }
      if (sm) {
        const name = NAME_RE.exec(after);
        if (name) {
          out += column?.(sheet ?? '', unquote(name[1], name[2])) ?? prefix + name[0];
          i += prefix.length + name[0].length;
          continue;
        }
      }
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * Rewrite the references in a formula's source for a structural op so
 * they keep pointing at the same cells: `=A5` becomes `=A6` when a row is
 * inserted above 5; a reference into a removed band becomes `#REF!`; a
 * range that overlaps a removed band shrinks. Other ops return the source
 * unchanged. Pure text-level; `applySheetOp` runs it over every surviving
 * formula of a structural op, and `transformSheetOp` over the strings an
 * op carries, so both sides of a concurrent pair rewrite identically.
 *
 * Without `sheet`, only the formula's own (unqualified) references are
 * rewritten; with it, only the references qualified with that sheet's
 * name — what a workbook runs over its other sheets when one of them
 * takes a structural op.
 */
export function rewriteFormulaRefs(source: string, op: SheetOp, sheet?: string): string {
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
  return mapFormulaRefs(source, ({ sheet: refSheet, prefix, from, to }) => {
    if (sheet === undefined ? refSheet !== null : refSheet === null || !sameSheet(refSheet, sheet)) return null;
    if (to === null) {
      const next = shiftAxis(from[axis], splice);
      return next === null ? '#REF!' : prefix + refText({ ...from, [axis]: next });
    }
    const lo = Math.min(from[axis], to[axis]);
    const hi = Math.max(from[axis], to[axis]);
    let nlo: number | null;
    let nhi: number | null;
    if (splice.kind === 'insert') {
      // An insert inside the range grows it; at its start moves it.
      nlo = shiftAxis(lo, splice);
      nhi = hi >= splice.at ? hi + splice.count : hi;
    } else {
      // A range is the tracks between its two end tracks. A removal
      // strictly inside shrinks it; one that takes either end is
      // `#REF!` — where Excel would shrink to the survivors. Ends are
      // tracks, and the transform preserves track identity, so this is
      // what keeps concurrent structural edits convergent (TP1): after
      // a shrink, "the first track" and "just before the first track"
      // could no longer be told apart by a concurrent insert.
      nlo = shiftAxis(lo, splice);
      nhi = shiftAxis(hi, splice);
    }
    if (nlo === null || nhi === null) return '#REF!';
    const a = { ...from, [axis]: from[axis] <= to[axis] ? nlo : nhi };
    const b = { ...to, [axis]: from[axis] <= to[axis] ? nhi : nlo };
    return `${prefix}${refText(a)}:${refText(b)}`;
  });
}

/**
 * The formula moved by (`rows`, `cols`) cells: relative references shift
 * with it, `$`-anchored axes stay — what a fill or a copy-paste does to a
 * formula. A reference shifted off the sheet's top or left is `#REF!`.
 */
export function shiftFormulaRefs(source: string, rows: number, cols: number): string {
  const move = (ref: FormulaRef): FormulaRef | null => {
    const row = ref.absRow ? ref.row : ref.row + rows;
    const col = ref.absCol ? ref.col : ref.col + cols;
    return row < 0 || col < 0 ? null : { ...ref, row, col };
  };
  return mapFormulaRefs(source, ({ prefix, from, to }) => {
    const a = move(from);
    const b = to === null ? null : move(to);
    if (a === null || (to !== null && b === null)) return '#REF!';
    return prefix + refText(a) + (b === null ? '' : `:${refText(b)}`);
  });
}

/** The formula with every reference into sheet `from` re-pointed at sheet `to` (a renamed sheet). */
export function renameFormulaSheet(source: string, from: string, to: string): string {
  const prefix = `${formulaNameText(to)}!`;
  return mapFormulaRefs(
    source,
    (match) =>
      match.sheet !== null && sameSheet(match.sheet, from)
        ? prefix + refText(match.from) + (match.to === null ? '' : `:${refText(match.to)}`)
        : null,
    (sheet, name) => (sameSheet(sheet, from) ? prefix + formulaNameText(name) : null)
  );
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

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * What a function sees while it runs: the cell being evaluated, the model,
 * the evaluated value of any other cell, and the host's `external` bag
 * (`[functionContext]` on `sh-spreadsheet`; app data a function reads).
 *
 * Cells read through `valueAt` are not dependencies of the formula — the
 * graph is built from the references in the source. A function whose result
 * depends on `external` or on `valueAt` should be `volatile` so that it is
 * recomputed on every update and on `recalc()`.
 */
export interface SheetFunctionContext {
  readonly row: number;
  readonly col: number;
  /** The cell's A1 address. */
  readonly address: string;
  readonly model: SheetModel;
  /** The evaluated value of another cell, by A1 text or by index; `#REF!` off the sheet. */
  valueAt(ref: string | { row: number; col: number }): SheetValue;
  /** The host's bag — whatever `[functionContext]` was given, `undefined` by default. */
  readonly external: unknown;
}

/** A formula function. Names are case-insensitive; ranges arrive flattened into `args`. */
export interface SheetFunction {
  readonly name: string;
  readonly minArgs?: number;
  /** Ignored when `variadic`. */
  readonly maxArgs?: number;
  readonly variadic?: boolean;
  /** Return a value, a `FormulaError`, or throw: a thrown error reads `#ERROR!` with its message. */
  call(args: SheetValue[], ctx: SheetFunctionContext): SheetValue;
  /** Recomputed on every update and `recalc()`, not only when a referenced cell changes. */
  readonly volatile?: boolean;
  /** One line for the formula bar's help. */
  readonly description?: string;
  /** How to call it, e.g. `SUM(a, b, ...)`. */
  readonly signature?: string;
}

const withNumbers = (f: (ns: number[]) => FormulaValue) => (args: Args) => {
  const ns = numbers(args);
  return Array.isArray(ns) ? f(ns) : ns;
};

/** The functions every evaluator has: SUM AVG AVERAGE MIN MAX COUNT COUNTA ABS ROUND IF CONCAT LEN TODAY. */
export const SHEET_BUILTIN_FUNCTIONS: readonly SheetFunction[] = [
  {
    name: 'SUM',
    variadic: true,
    signature: 'SUM(a, b, ...)',
    description: 'Adds the numbers; text and blanks are skipped.',
    call: withNumbers((ns) => ns.reduce((a, b) => a + b, 0)),
  },
  ...['AVG', 'AVERAGE'].map((name): SheetFunction => ({
    name,
    variadic: true,
    signature: `${name}(a, b, ...)`,
    description: 'The mean of the numbers.',
    call: withNumbers((ns) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : err('#DIV/0!'))),
  })),
  {
    name: 'MIN',
    variadic: true,
    signature: 'MIN(a, b, ...)',
    description: 'The smallest number.',
    call: withNumbers((ns) => (ns.length ? Math.min(...ns) : 0)),
  },
  {
    name: 'MAX',
    variadic: true,
    signature: 'MAX(a, b, ...)',
    description: 'The largest number.',
    call: withNumbers((ns) => (ns.length ? Math.max(...ns) : 0)),
  },
  {
    name: 'COUNT',
    variadic: true,
    signature: 'COUNT(a, b, ...)',
    description: 'How many of the values are numbers.',
    call: withNumbers((ns) => ns.length),
  },
  {
    name: 'COUNTA',
    variadic: true,
    signature: 'COUNTA(a, b, ...)',
    description: 'How many of the values are not blank.',
    call: (args) => args.filter((v) => v !== null).length,
  },
  {
    name: 'ABS',
    minArgs: 1,
    maxArgs: 1,
    signature: 'ABS(x)',
    description: 'The absolute value.',
    call: (args) => {
      const n = toNumber(args[0] ?? null);
      return typeof n === 'number' ? Math.abs(n) : n;
    },
  },
  {
    name: 'ROUND',
    minArgs: 1,
    maxArgs: 2,
    signature: 'ROUND(x, digits)',
    description: 'Rounds to the given number of decimals (0 by default).',
    call: (args) => {
      const n = toNumber(args[0] ?? null);
      const d = toNumber(args[1] ?? 0);
      if (typeof n !== 'number') return n;
      if (typeof d !== 'number') return d;
      const f = 10 ** Math.trunc(d);
      return Math.round(n * f) / f;
    },
  },
  {
    name: 'IF',
    minArgs: 1,
    maxArgs: 3,
    signature: 'IF(test, then, else)',
    description: 'One value when the test holds, the other when it does not.',
    call: (args) => {
      const c = args[0] ?? null;
      if (isFormulaError(c)) return c;
      const truthy = typeof c === 'string' ? c !== '' : !!c;
      return truthy ? (args[1] ?? true) : (args[2] ?? false);
    },
  },
  {
    name: 'CONCAT',
    variadic: true,
    signature: 'CONCAT(a, b, ...)',
    description: 'Joins the values as text.',
    call: (args) => {
      let s = '';
      for (const v of args) {
        const t = toText(v);
        if (typeof t !== 'string') return t;
        s += t;
      }
      return s;
    },
  },
  {
    name: 'LEN',
    minArgs: 1,
    maxArgs: 1,
    signature: 'LEN(text)',
    description: 'The length of the text.',
    call: (args) => {
      const t = toText(args[0] ?? null);
      return typeof t === 'string' ? t.length : t;
    },
  },
  {
    name: 'TODAY',
    maxArgs: 0,
    volatile: true,
    signature: 'TODAY()',
    description: "Today's date, ISO.",
    call: () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
  },
];

/**
 * The functions an evaluator knows, by upper-case name. Mirrors
 * `SheetCellRegistry`: the given functions are merged over the built-ins,
 * a function with a built-in's name replaces it.
 */
export class SheetFunctionRegistry {
  readonly #byName = new Map<string, SheetFunction>();

  constructor(
    functions: readonly SheetFunction[] = [],
    base: readonly SheetFunction[] | SheetFunctionRegistry = SHEET_BUILTIN_FUNCTIONS
  ) {
    const inherited = base instanceof SheetFunctionRegistry ? base.list() : base;
    for (const fn of [...inherited, ...functions]) this.#byName.set(fn.name.toUpperCase(), fn);
  }

  get(name: string): SheetFunction | undefined {
    return this.#byName.get(name.toUpperCase());
  }

  has(name: string): boolean {
    return this.#byName.has(name.toUpperCase());
  }

  /** Upper-case names, in registration order. */
  names(): string[] {
    return [...this.#byName.keys()];
  }

  /** Every function, in registration order. */
  list(): SheetFunction[] {
    return [...this.#byName.values()];
  }

  /** A new registry with `functions` merged over this one. */
  with(functions: readonly SheetFunction[]): SheetFunctionRegistry {
    return new SheetFunctionRegistry(functions, this);
  }
}

/** The registry every `SheetEvaluator` uses unless given another: the built-ins. */
export const SHEET_DEFAULT_FUNCTIONS = new SheetFunctionRegistry();

/** Call a registered function with arity checks and thrown errors turned into `#ERROR!`. */
function callFunction(fn: SheetFunction, args: Args, ctx: SheetFunctionContext): FormulaValue {
  const min = fn.minArgs ?? 0;
  const max = fn.variadic ? Infinity : (fn.maxArgs ?? Infinity);
  if (args.length < min || args.length > max) {
    const expected = max === Infinity ? `at least ${min}` : min === max ? `${min}` : `${min} to ${max}`;
    return err(
      '#ERROR!',
      `${fn.name.toUpperCase()} takes ${expected} argument${expected === '1' ? '' : 's'}, got ${args.length}`
    );
  }
  try {
    const value = fn.call(args, ctx);
    return value === undefined ? null : value;
  } catch (e) {
    return err('#ERROR!', e instanceof Error ? e.message : String(e));
  }
}

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
      return op === '='
        ? cmp === 0
        : op === '<>'
          ? cmp !== 0
          : op === '<'
            ? cmp < 0
            : op === '>'
              ? cmp > 0
              : op === '<='
                ? cmp <= 0
                : cmp >= 0;
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

/** One sheet of a workbook as a formula on another sheet reads it. */
export interface SheetWorkbookSheet {
  readonly rows: number;
  readonly cols: number;
  /** The evaluated value of a cell; `null` when empty or off the sheet. */
  cell(row: number, col: number): SheetValue;
  /** The values of a named column (`Tasks!Title`), top to bottom; `null` when the sheet has no such column. */
  column?(name: string): readonly SheetValue[] | null;
}

/**
 * What resolves `Sheet2!A1` and `Tasks!Title`: the other sheets of the
 * workbook, by name (case-insensitive is the host's call). Cross-sheet
 * references are not dependencies in a sheet's graph: a formula holding one
 * is recomputed on every `update` and on `recalc()`, so the host recalcs
 * when a referenced sheet changes (the composer does, whenever `[workbook]`
 * is a new value).
 */
export interface SheetWorkbook {
  sheet(name: string): SheetWorkbookSheet | null;
}

/**
 * Evaluates the formulas of a sheet and keeps the result current across
 * ops. Values are derived state: the model is never written. `update`
 * with the ops that produced the new model marks only the formulas whose
 * inputs changed (transitively) for recomputation; without ops — a loaded
 * document, a structural op — everything is. Values are computed on read
 * (`valueAt`), so a chain of sheets reading each other through a workbook
 * resolves in whatever order the host brings them up to date.
 */
export class SheetEvaluator {
  #model: SheetModel | null = null;
  /** Parsed formula per cell index (`null`: syntax error). */
  #ast = new Map<number, FormulaNode | null>();
  #deps = new Map<number, Set<number>>();
  #dependents = new Map<number, Set<number>>();
  /** Formulas whose ranges are too large to track per cell: dirty on any change. */
  #wide = new Set<number>();
  /** Formulas calling a volatile function or reading another sheet: dirty on every update and on `recalc()`. */
  #volatile = new Set<number>();
  #values = new Map<number, FormulaValue>();
  #visiting = new Set<number>();
  /** Set when an evaluation runs into a cell that is still being evaluated. */
  #cycleHit = false;

  /**
   * The host's bag, handed to every function as `ctx.external`. Setting it
   * does not recompute anything by itself: call `recalc()` after (the
   * composer does, whenever `[functionContext]` changes).
   */
  external: unknown = undefined;

  /** The other sheets, for `Sheet2!A1`; without one every cross-sheet reference is `#REF!`. Set, then `recalc()`. */
  workbook: SheetWorkbook | null = null;

  /** `functions`: the registry the formulas resolve names against — the built-ins by default. */
  constructor(readonly functions: SheetFunctionRegistry = SHEET_DEFAULT_FUNCTIONS) {}

  /** The model as last seen. */
  get model(): SheetModel | null {
    return this.#model;
  }

  /** Bring the evaluator up to `model`; `ops` are what turned the previous model into it. */
  update(model: SheetModel, ops?: readonly SheetOp[]): void {
    const previous = this.#model;
    this.#model = model;
    const incremental =
      previous !== null &&
      ops !== undefined &&
      previous.rows === model.rows &&
      previous.cols === model.cols &&
      ops.every((op) => op.kind === 'set-cells');
    if (!incremental) {
      this.#rebuild();
      return;
    }
    const changed = new Set<number>(this.#volatile);
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
    return this.#ast.has(index) ? formatFormulaValue(this.#evaluate(index)) : model.cells[index];
  }

  /** The typed value of a cell: a formula's result, else the literal's value; `null` when empty or off the sheet. */
  cellValue(row: number, col: number): FormulaValue {
    const model = this.#model;
    if (!model || row < 0 || col < 0 || row >= model.rows || col >= model.cols) return null;
    return this.#evaluate(row * model.cols + col);
  }

  /** The error a formula cell shows, or null. */
  errorAt(row: number, col: number): FormulaErrorCode | null {
    const v = this.#formulaValue(row, col);
    return v !== null && isFormulaError(v) ? v.error : null;
  }

  /** The message behind a formula cell's error (a thrown error's, an arity mismatch), or null. */
  errorMessageAt(row: number, col: number): string | null {
    const v = this.#formulaValue(row, col);
    return v !== null && isFormulaError(v) ? (v.message ?? null) : null;
  }

  #formulaValue(row: number, col: number): FormulaValue {
    const model = this.#model;
    if (!model || row < 0 || col < 0 || row >= model.rows || col >= model.cols) return null;
    const index = row * model.cols + col;
    return this.#ast.has(index) ? this.#evaluate(index) : null;
  }

  /**
   * Recompute every formula against the current model and `external`. For
   * a host whose function data changed outside the model; `update` alone
   * recomputes only the volatile formulas and what the ops touched.
   */
  recalc(): void {
    if (!this.#model) return;
    this.#recompute(new Set(this.#ast.keys()));
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
    this.#volatile.clear();
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
    this.#volatile.delete(index);
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
          if (node.ref.sheet !== undefined) this.#volatile.add(index);
          else if (node.ref.row < model.rows && node.ref.col < model.cols)
            deps.add(node.ref.row * model.cols + node.ref.col);
          return;
        case 'column':
          this.#volatile.add(index);
          return;
        case 'range': {
          if (node.from.sheet !== undefined) {
            this.#volatile.add(index);
            return;
          }
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
          if (this.functions.get(node.name)?.volatile) this.#volatile.add(index);
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
    // Values are dropped, not recomputed: `#evaluate` fills them in on read.
    for (const i of dirty) this.#values.delete(i);
    this.#visiting.clear();
    this.#cycleHit = false;
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
    let value = this.#eval(ast, index);
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

  /** The context a function called from cell `index` sees. */
  #context(index: number): SheetFunctionContext {
    const model = this.#model!;
    const row = Math.floor(index / model.cols);
    const col = index % model.cols;
    return {
      row,
      col,
      address: `${formulaColLabel(col)}${row + 1}`,
      model,
      external: this.external,
      valueAt: (ref) => {
        if (typeof ref === 'string') {
          const m = REF_RE.exec(ref.trim());
          if (!m || m[0].length !== ref.trim().length) return err('#REF!');
          return this.#cell(Number(m[4]) - 1, formulaColIndex(m[2]));
        }
        return this.#cell(ref.row, ref.col);
      },
    };
  }

  #eval(node: FormulaNode, index: number): FormulaValue {
    switch (node.t) {
      case 'num':
      case 'str':
      case 'bool':
        return node.v;
      case 'err':
        return err(node.v);
      case 'ref':
        return node.ref.sheet === undefined ? this.#cell(node.ref.row, node.ref.col) : this.#externalCell(node.ref);
      case 'range':
      case 'column':
        return err('#VALUE!');
      case 'neg': {
        const n = toNumber(this.#eval(node.e, index));
        return typeof n === 'number' ? -n : n;
      }
      case 'bin':
        return binary(node.op, this.#eval(node.l, index), this.#eval(node.r, index));
      case 'call': {
        const fn = this.functions.get(node.name);
        if (!fn) return err('#NAME?');
        const args: Args = [];
        for (const arg of node.args) {
          if (arg.t === 'range' && arg.from.sheet !== undefined) {
            const sheet = this.workbook?.sheet(arg.from.sheet) ?? null;
            if (!sheet) args.push(err('#REF!'));
            else {
              const r0 = Math.min(arg.from.row, arg.to.row);
              const r1 = Math.min(Math.max(arg.from.row, arg.to.row), sheet.rows - 1);
              const c0 = Math.min(arg.from.col, arg.to.col);
              const c1 = Math.min(Math.max(arg.from.col, arg.to.col), sheet.cols - 1);
              for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) args.push(sheet.cell(r, c));
            }
          } else if (arg.t === 'range') {
            const model = this.#model!;
            const r0 = Math.min(arg.from.row, arg.to.row);
            const r1 = Math.min(Math.max(arg.from.row, arg.to.row), model.rows - 1);
            const c0 = Math.min(arg.from.col, arg.to.col);
            const c1 = Math.min(Math.max(arg.from.col, arg.to.col), model.cols - 1);
            for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) args.push(this.#cell(r, c));
          } else if (arg.t === 'column') {
            const values = this.workbook?.sheet(arg.sheet)?.column?.(arg.name) ?? null;
            if (values) args.push(...values);
            else args.push(err('#REF!'));
          } else args.push(this.#eval(arg, index));
        }
        return callFunction(fn, args, this.#context(index));
      }
    }
  }

  /** A cell on another sheet through the workbook; `#REF!` without one or when the sheet is unknown. */
  #externalCell(ref: FormulaRef): FormulaValue {
    const sheet = ref.sheet === undefined ? null : (this.workbook?.sheet(ref.sheet) ?? null);
    if (!sheet) return err('#REF!');
    if (ref.row >= sheet.rows || ref.col >= sheet.cols) return null;
    return sheet.cell(ref.row, ref.col);
  }
}
