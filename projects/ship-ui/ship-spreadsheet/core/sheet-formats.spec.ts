// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { SheetCellRegistry } from './sheet-extensions';
import { parseTsv, sheetRangeToHtml, sheetRangeToTsv } from './sheet-clipboard';
import {
  localeMonthFirst,
  parseSheetDate,
  parseSheetNumber,
  sheetCurrencyExtension,
  sheetDateExtension,
  sheetNumberExtension,
  sheetPercentExtension,
} from './sheet-formats';
import { applySheetOps, createSheet } from './sheet-model';
import { sheetFromTable } from './sheet-table';

const ctx = { row: 0, col: 0, type: 'x' };

describe('parseSheetNumber', () => {
  it('reads locale separators, symbols and accounting forms into a canonical string', () => {
    expect(parseSheetNumber('1,234.5', 'en-US')).toBe('1234.5');
    expect(parseSheetNumber('1.234,5', 'da-DK')).toBe('1234.5');
    expect(parseSheetNumber('1,5', 'en-US')).toBe('1.5');
    expect(parseSheetNumber('1,234', 'en-US')).toBe('1234');
    expect(parseSheetNumber('1.234', 'da-DK')).toBe('1234');
    expect(parseSheetNumber('1 234 567,89', 'fr-FR')).toBe('1234567.89');
    expect(parseSheetNumber('$1,234.00', 'en-US')).toBe('1234');
    expect(parseSheetNumber('USD 12', 'en-US')).toBe('12');
    expect(parseSheetNumber('12 kr.', 'da-DK')).toBe('12');
    expect(parseSheetNumber('(42)', 'en-US')).toBe('-42');
    expect(parseSheetNumber('-$5', 'en-US')).toBe('-5');
    expect(parseSheetNumber('$-5', 'en-US')).toBe('-5');
    expect(parseSheetNumber('12.', 'en-US')).toBe('12');
    expect(parseSheetNumber('-0.5', 'en-US')).toBe('-0.5');
    expect(parseSheetNumber('1e3', 'en-US')).toBe('1000');
    expect(parseSheetNumber('  ', 'en-US')).toBe('');
  });

  it('rejects text that is not a number', () => {
    expect(parseSheetNumber('abc', 'en-US')).toBeNull();
    expect(parseSheetNumber('1.2.3.4', 'en-US')).toBe('1234');
    expect(parseSheetNumber('12a3', 'en-US')).toBeNull();
    expect(parseSheetNumber('--1', 'en-US')).toBeNull();
  });
});

describe('number / currency / percent extensions', () => {
  it('number: grouping and fixed decimals in the display, canonical in the model', () => {
    const ext = sheetNumberExtension({ locale: 'en-US', decimals: 2 });
    expect(ext.parse!('1,234.5', ctx)).toBe('1234.5');
    expect(ext.render('1234.5', ctx)).toBe('1,234.50');
    expect(ext.toText!('1234.5', ctx)).toBe('1,234.50');
    expect(ext.render('', ctx)).toBe('');
    expect(ext.validate!('1234.5', ctx)).toBeNull();
    expect(ext.validate!('twelve', ctx)).toBe('Not a number');
    expect(ext.render('twelve', ctx)).toBe('twelve');
    const plain = sheetNumberExtension({ locale: 'en-US', thousands: false });
    expect(plain.render('1234.5678', ctx)).toBe('1234.5678');
    const danish = sheetNumberExtension({ locale: 'da-DK' });
    expect(danish.render('1234.5', ctx)).toBe('1.234,5');
  });

  it('currency: code and locale', () => {
    expect(sheetCurrencyExtension({ locale: 'en-US' }).render('1234.5', ctx)).toBe('$1,234.50');
    expect(sheetCurrencyExtension({ locale: 'en-US', code: 'EUR' }).render('-3', ctx)).toBe('-€3.00');
    expect(sheetCurrencyExtension({ locale: 'da-DK', code: 'DKK' }).render('1234.5', ctx)).toMatch(/^1\.234,50\s*kr\.$/);
    expect(sheetCurrencyExtension({ locale: 'en-US', decimals: 0 }).render('1234.5', ctx)).toBe('$1,235');
    expect(sheetCurrencyExtension({ locale: 'en-US' }).parse!('$1,234.50', ctx)).toBe('1234.5');
    expect(sheetCurrencyExtension({ locale: 'en-US' }).type).toBe('currency');
  });

  it('percent: fraction in the model, per cent in the cell and the editor', () => {
    const ext = sheetPercentExtension({ locale: 'en-US' });
    expect(ext.parse!('25', ctx)).toBe('0.25');
    expect(ext.parse!('25%', ctx)).toBe('0.25');
    expect(ext.parse!('12.5 %', ctx)).toBe('0.125');
    expect(ext.parse!('', ctx)).toBe('');
    expect(ext.parse!('x', ctx)).toBeNull();
    expect(ext.render('0.25', ctx)).toBe('25%');
    expect(ext.render('0.125', ctx)).toBe('12.5%');
    expect(ext.render('0.1', ctx)).toBe('10%');
    expect(ext.format!('0.1', ctx)).toBe('10%');
    expect(ext.format!('0.125', ctx)).toBe('12.5%');
    expect(sheetPercentExtension({ locale: 'en-US', decimals: 1 }).render('0.25', ctx)).toBe('25.0%');
  });
});

describe('parseSheetDate', () => {
  it('reads ISO, locale-ordered numeric and natural dates into ISO', () => {
    expect(parseSheetDate('2026-09-22', 'en-US')).toBe('2026-09-22');
    expect(parseSheetDate('2026-02-30', 'en-US')).toBeNull();
    expect(parseSheetDate('2026/9/2', 'en-US')).toBe('2026-09-02');
    expect(localeMonthFirst('en-US')).toBe(true);
    expect(localeMonthFirst('da-DK')).toBe(false);
    expect(parseSheetDate('9/22/2026', 'en-US')).toBe('2026-09-22');
    expect(parseSheetDate('22/9/2026', 'da-DK')).toBe('2026-09-22');
    expect(parseSheetDate('22.9.26', 'da-DK')).toBe('2026-09-22');
    // Impossible in the locale's order: the other reading wins.
    expect(parseSheetDate('22/9/2026', 'en-US')).toBe('2026-09-22');
    expect(parseSheetDate('9/22/2026', 'da-DK')).toBe('2026-09-22');
    expect(parseSheetDate('Sep 22, 2026', 'en-US')).toBe('2026-09-22');
    expect(parseSheetDate('', 'en-US')).toBe('');
    expect(parseSheetDate('someday', 'en-US')).toBeNull();
  });

  it('date extension: locale display, ISO model, date input', () => {
    const ext = sheetDateExtension({ locale: 'en-US' });
    expect(ext.inputType).toBe('date');
    expect(ext.render('2026-09-22', ctx)).toBe('Sep 22, 2026');
    expect(sheetDateExtension({ locale: 'da-DK' }).render('2026-09-22', ctx)).toMatch(/22\. sep\.? 2026/);
    expect(sheetDateExtension({ locale: 'en-US', dateStyle: 'short' }).render('2026-09-22', ctx)).toBe('9/22/26');
    expect(ext.render('not a date', ctx)).toBe('not a date');
    expect(ext.validate!('2026-09-22', ctx)).toBeNull();
    expect(ext.validate!('2026-13-01', ctx)).toMatch(/Not a date/);
    expect(ext.validate!('', ctx)).toBeNull();
    // The editor opens on the ISO string — what a date input takes.
    expect(ext.format).toBeUndefined();
  });
});

describe('registry and serialisers', () => {
  const registry = new SheetCellRegistry([sheetCurrencyExtension({ locale: 'en-US' }), sheetDateExtension({ locale: 'en-US' })]);
  const model = applySheetOps(createSheet(2, 3, ['Item', 'Price', 'When', 'Rope', '12.5', '2026-09-22']), [
    { kind: 'set-col-type', col: 1, type: 'currency' },
    { kind: 'set-col-type', col: 2, type: 'date' },
  ]).model;
  const all = { r0: 0, c0: 0, r1: 1, c1: 2 };

  it('registers the built-in formatted types, overridable by an app extension', () => {
    expect(new SheetCellRegistry().types()).toEqual(['text', 'checkbox', 'number', 'currency', 'percent', 'date']);
    expect(registry.get('currency').render('1', ctx)).toBe('$1.00');
  });

  it('TSV is raw by default and typed text with a registry', () => {
    expect(sheetRangeToTsv(model, all)).toBe('Item\tPrice\tWhen\nRope\t12.5\t2026-09-22');
    expect(sheetRangeToTsv(model, all, registry)).toBe('Item\tPrice\tWhen\nRope\t$12.50\tSep 22, 2026');
  });

  it('HTML shows the display form, carries the raw, and pastes back losslessly', () => {
    const html = sheetRangeToHtml(model, all, registry);
    expect(html).toContain('<td data-raw="12.5">$12.50</td>');
    expect(html).toContain('<td data-raw="2026-09-22">Sep 22, 2026</td>');
    expect(html).toContain('<td>Rope</td>');
    const table = new DOMParser().parseFromString(html, 'text/html').querySelector('table')!;
    expect(sheetFromTable(table)!.cells).toEqual(model.cells);
    expect(sheetRangeToHtml(model, all)).toContain('<td>12.5</td>');
    expect(parseTsv(sheetRangeToTsv(model, all))).toEqual([
      ['Item', 'Price', 'When'],
      ['Rope', '12.5', '2026-09-22'],
    ]);
  });
});
