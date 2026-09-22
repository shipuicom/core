// ---------------------------------------------------------------------------
// ShipSpreadsheet — built-in formatted cell types
// ---------------------------------------------------------------------------
//
// `number`, `currency`, `percent` and `date` columns. The model keeps a
// canonical string per cell (a plain JavaScript number literal; an ISO
// `YYYY-MM-DD` date) so ops, transforms, sorting and interchange stay
// locale-free; the extension turns what the user typed into that string
// (`parse`), and the string into what the locale shows (`render`). The
// defaults use the host locale; the factories take one explicitly.

import type { SheetCellExtension } from './sheet-extensions';
import { escapeSheetHtml } from './sheet-html';

export interface SheetNumberFormatOptions {
  /** Fixed number of fraction digits; omitted: up to 10, as typed. */
  decimals?: number;
  /** Thousands grouping in the display (default true). */
  thousands?: boolean;
  /** BCP 47 locale for display and for reading typed separators; default: the host's. */
  locale?: string;
}

export interface SheetCurrencyFormatOptions extends SheetNumberFormatOptions {
  /** ISO 4217 code (default `USD`). */
  code?: string;
}

export interface SheetDateFormatOptions {
  locale?: string;
  /** `Intl.DateTimeFormat` date style (default `medium`). */
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

const separatorCache = new Map<string, { group: string; decimal: string }>();

/** The locale's group and decimal separators. */
export function numberSeparators(locale?: string): { group: string; decimal: string } {
  const key = locale ?? '';
  let out = separatorCache.get(key);
  if (!out) {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.8);
    out = {
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    };
    separatorCache.set(key, out);
  }
  return out;
}

/**
 * Read a typed or pasted number into its canonical string. Accepts locale
 * separators, currency symbols and codes around the digits, a `%` suffix,
 * accounting parentheses and exponents. `''` for blank; `null` when the
 * text is not a number.
 */
export function parseSheetNumber(input: string, locale?: string): string | null {
  let text = input.trim();
  if (text === '') return '';
  if (/^\(.*\)$/.test(text)) text = `-${text.slice(1, -1)}`;
  // Symbols and words around the digits: `$`, `USD `, ` kr`, `%`.
  text = text
    .replace(/^[^\d\-+.,]+/, '')
    .replace(/^([-+])[^\d.,\-+]+/, '$1')
    .replace(/\D+$/, '');
  // Whitespace and apostrophes only ever group.
  text = text.replace(/[\s  '’_]/g, '');
  const { group, decimal } = numberSeparators(locale);
  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');
  let dec: string | null;
  if (lastDot >= 0 && lastComma >= 0) dec = lastDot > lastComma ? '.' : ',';
  else if (lastDot < 0 && lastComma < 0) dec = null;
  else {
    const only = lastDot >= 0 ? '.' : ',';
    const count = text.split(only).length - 1;
    // A repeated separator groups; the locale's group separator followed by
    // exactly three digits groups too (`1,234` in en-US); anything else is
    // the decimal point, whatever the locale (`1,5` reads as one and a half).
    dec = count > 1 ? null : only === decimal ? only : only === group && /[.,]\d{3}$/.test(text) ? null : only;
  }
  const digits = dec === null ? text.replace(/[.,]/g, '') : text.split(dec).join('\0').replace(/[.,]/g, '').replace('\0', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(digits)) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? String(n) : null;
}

function numberFormatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat(undefined, options);
  }
}

const notANumber = (raw: string) => (raw === '' || Number.isFinite(Number(raw)) ? null : 'Not a number');

/** Display form of a canonical number through a formatter; a non-number shows as is. */
function display(raw: string, fmt: Intl.NumberFormat, scale = 1): string {
  if (raw === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) ? fmt.format(n * scale) : raw;
}

/** A `number` column: canonical number strings, locale display, grouping and fixed decimals. */
export function sheetNumberExtension(options: SheetNumberFormatOptions = {}): SheetCellExtension {
  const { decimals, thousands = true, locale } = options;
  const fmt = numberFormatter(locale, {
    useGrouping: thousands,
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 10,
  });
  const text = (raw: string) => display(raw, fmt);
  return {
    type: 'number',
    render: (raw) => escapeSheetHtml(text(raw)),
    parse: (input) => parseSheetNumber(input, locale),
    validate: notANumber,
    toText: text,
  };
}

/** A `currency` column: canonical number strings shown as an amount in `code`. */
export function sheetCurrencyExtension(options: SheetCurrencyFormatOptions = {}): SheetCellExtension {
  const { decimals, thousands = true, locale, code = 'USD' } = options;
  const fmt = numberFormatter(locale, {
    style: 'currency',
    currency: code,
    useGrouping: thousands,
    ...(decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  });
  const text = (raw: string) => display(raw, fmt);
  return {
    type: 'currency',
    render: (raw) => escapeSheetHtml(text(raw)),
    parse: (input) => parseSheetNumber(input, locale),
    validate: notANumber,
    toText: text,
  };
}

/** Percent of a fraction as a plain number string, without float noise (`0.1` → `10`). */
function percentOf(raw: string): string {
  const n = Number(raw);
  return Number.isFinite(n) ? String(Number((n * 100).toPrecision(12))) : raw;
}

/**
 * A `percent` column: the model holds the fraction (`0.25`), the cell shows
 * `25%`, and typing `25` or `25%` both store `0.25` — the spreadsheet
 * convention.
 */
export function sheetPercentExtension(options: SheetNumberFormatOptions = {}): SheetCellExtension {
  const { decimals, thousands = true, locale } = options;
  const fmt = numberFormatter(locale, {
    style: 'percent',
    useGrouping: thousands,
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 2,
  });
  const text = (raw: string) => display(raw, fmt);
  return {
    type: 'percent',
    render: (raw) => escapeSheetHtml(text(raw)),
    parse: (input) => {
      const n = parseSheetNumber(input, locale);
      return n === null || n === '' ? n : String(Number((Number(n) / 100).toPrecision(12)));
    },
    format: (raw) => (raw === '' ? '' : `${percentOf(raw)}%`),
    validate: notANumber,
    toText: text,
  };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` for a real calendar date, else null. */
function isoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 0 || y > 9999) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function isSheetDate(raw: string): boolean {
  const m = ISO_DATE.exec(raw);
  return !!m && isoDate(Number(m[1]), Number(m[2]), Number(m[3])) === raw;
}

const monthFirstCache = new Map<string, boolean>();

/** Whether the locale writes the month before the day (`en-US`), for `a/b/c` input. */
export function localeMonthFirst(locale?: string): boolean {
  const key = locale ?? '';
  let out = monthFirstCache.get(key);
  if (out === undefined) {
    try {
      const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(Date.UTC(2000, 10, 22)));
      out = parts.findIndex((p) => p.type === 'month') < parts.findIndex((p) => p.type === 'day');
    } catch {
      out = false;
    }
    monthFirstCache.set(key, out);
  }
  return out;
}

/**
 * Read a typed or pasted date into ISO `YYYY-MM-DD`. Accepts ISO, the
 * locale's numeric order with `/`, `.` or `-` (`22/9/2026`, `9/22/2026`,
 * `22.9.26`), and anything `Date.parse` understands (`Sep 22, 2026`).
 * `''` for blank; `null` when it is not a date.
 */
export function parseSheetDate(input: string, locale?: string): string | null {
  const text = input.trim();
  if (text === '') return '';
  const iso = ISO_DATE.exec(text);
  if (iso) return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const numeric = /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/.exec(text);
  if (numeric) {
    const [a, b, c] = [Number(numeric[1]), Number(numeric[2]), Number(numeric[3])];
    if (numeric[1].length === 4) return isoDate(a, b, c);
    const year = numeric[3].length <= 2 ? 2000 + c : c;
    const monthFirst = localeMonthFirst(locale);
    const [m, d] = monthFirst ? [a, b] : [b, a];
    // `13/1/2026` cannot be month-first whatever the locale; take the reading that is a date.
    return isoDate(year, m, d) ?? isoDate(year, d, m);
  }
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) return null;
  const date = new Date(ms);
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * A `date` column: ISO dates in the model, the locale's date in the cell,
 * the browser's date input for editing.
 */
export function sheetDateExtension(options: SheetDateFormatOptions = {}): SheetCellExtension {
  const { locale, dateStyle = 'medium' } = options;
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat(locale, { dateStyle, timeZone: 'UTC' });
  } catch {
    fmt = new Intl.DateTimeFormat(undefined, { dateStyle, timeZone: 'UTC' });
  }
  const text = (raw: string) => (isSheetDate(raw) ? fmt.format(new Date(`${raw}T00:00:00Z`)) : raw);
  return {
    type: 'date',
    inputType: 'date',
    render: (raw) => escapeSheetHtml(text(raw)),
    parse: (input) => parseSheetDate(input, locale),
    validate: (raw) => (raw === '' || isSheetDate(raw) ? null : 'Not a date (YYYY-MM-DD)'),
    toText: text,
  };
}

/** The built-in formatted types with the host locale and default options. */
export const SHEET_NUMBER_EXTENSION: SheetCellExtension = sheetNumberExtension();
export const SHEET_CURRENCY_EXTENSION: SheetCellExtension = sheetCurrencyExtension();
export const SHEET_PERCENT_EXTENSION: SheetCellExtension = sheetPercentExtension();
export const SHEET_DATE_EXTENSION: SheetCellExtension = sheetDateExtension();
