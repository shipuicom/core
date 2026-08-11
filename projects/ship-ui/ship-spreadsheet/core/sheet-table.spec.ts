import { describe, expect, it } from 'vitest';
import { applySheetOps, createSheet } from './sheet-model';
import { sheetRangeToHtml, sheetRangeToTsv } from './sheet-clipboard';
import { sheetFromTable, sheetToTableHtml } from './sheet-table';

function tableEl(html: string): Element {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('table')!;
}

describe('sheetToTableHtml', () => {
  it('emits a semantic table with escaped cells', () => {
    const model = createSheet(1, 2, ['<b>&', 'two']);
    expect(sheetToTableHtml(model)).toBe('<table><tbody><tr><td>&lt;b&gt;&amp;</td><td>two</td></tr></tbody></table>');
  });

  it('carries explicit sizes as width/height attributes', () => {
    const model = applySheetOps(createSheet(2, 2, ['a', 'b', 'c', 'd']), [
      { kind: 'set-col-width', col: 1, width: 120 },
      { kind: 'set-row-height', row: 0, height: 40 },
    ]).model;
    const html = sheetToTableHtml(model);
    expect(html).toContain('<colgroup><col><col width="120"></colgroup>');
    expect(html).toContain('<tr height="40">');
  });

  it('round-trips through sheetFromTable', () => {
    const model = applySheetOps(createSheet(2, 3, ['a', 'b', 'c', 'd', 'e', 'f']), [
      { kind: 'set-col-width', col: 0, width: 80 },
      { kind: 'set-row-height', row: 1, height: 32 },
    ]).model;
    expect(sheetFromTable(tableEl(sheetToTableHtml(model)))).toEqual(model);
  });
});

describe('sheetFromTable', () => {
  it('parses thead/tbody rows and th cells', () => {
    const model = sheetFromTable(
      tableEl('<table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>a</td><td>b</td></tr></tbody></table>')
    )!;
    expect(model.rows).toBe(2);
    expect(model.cols).toBe(2);
    expect(model.cells).toEqual(['H1', 'H2', 'a', 'b']);
  });

  it('pads colspan cells and ragged rows to a rectangle', () => {
    const model = sheetFromTable(
      tableEl('<table><tr><td colspan="2">wide</td><td>c</td></tr><tr><td>only</td></tr></table>')
    )!;
    expect(model.cols).toBe(3);
    expect(model.cells).toEqual(['wide', '', 'c', 'only', '', '']);
  });

  it('reads col width and tr height attributes, spans included', () => {
    const model = sheetFromTable(
      tableEl('<table><colgroup><col span="2" width="64"><col width="90px"></colgroup><tr height="30"><td>a</td><td>b</td><td>c</td></tr></table>')
    )!;
    expect(model.colWidths).toEqual([64, 64, 90]);
    expect(model.rowHeights).toEqual([30]);
  });

  it('ignores nested tables and normalizes nbsp/whitespace', () => {
    const model = sheetFromTable(
      tableEl('<table><tr><td> a b </td><td><table><tr><td>inner</td></tr></table></td></tr></table>')
    )!;
    expect(model.rows).toBe(1);
    expect(model.cells[0]).toBe('a b');
  });

  it('returns null for non-tables and empty tables', () => {
    expect(sheetFromTable(tableEl('<table></table>'))).toBeNull();
    const doc = new DOMParser().parseFromString('<div></div>', 'text/html');
    expect(sheetFromTable(doc.querySelector('div')!)).toBeNull();
  });
});

describe('clipboard flavors', () => {
  const model = createSheet(2, 2, ['a', 'b\tb', 'c"c', 'd\nd']);

  it('writes TSV with spreadsheet-style quoting', () => {
    expect(sheetRangeToTsv(model, { r0: 0, c0: 0, r1: 1, c1: 1 })).toBe('a\t"b\tb"\n"c""c"\t"d\nd"');
  });

  it('writes an escaped table fragment for the rich flavor', () => {
    expect(sheetRangeToHtml(model, { r0: 0, c0: 0, r1: 0, c1: 0 })).toBe('<table><tbody><tr><td>a</td></tr></tbody></table>');
  });

  it('accepts unordered corners', () => {
    expect(sheetRangeToTsv(model, { r0: 1, c0: 1, r1: 0, c1: 0 })).toBe('a\t"b\tb"\n"c""c"\t"d\nd"');
  });
});
