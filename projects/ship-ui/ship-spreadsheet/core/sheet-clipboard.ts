// ---------------------------------------------------------------------------
// ShipSpreadsheet — clipboard flavors
// ---------------------------------------------------------------------------
//
// Copy-out writes two flavors: TSV for text targets (terminals, plain
// editors, spreadsheet paste) and a `<table>` fragment for rich targets —
// the same pairing Excel and Google Sheets put on the clipboard.

import { SheetCellRegistry } from './sheet-extensions';
import { escapeSheetHtml } from './sheet-html';
import { SheetModel, SheetRange, cellAt, colTypeAt, normalizedRange } from './sheet-model';

/** The evaluated view of a sheet a text export can read formula values from (`ShipSpreadsheet.values()`). */
export interface SheetValueSource {
  valueAt(row: number, col: number): string;
}

/** The cell's text through its column type's `toText`; raw without a registry. A formula exports its value when `values` is given. */
function textAt(model: SheetModel, r: number, c: number, registry?: SheetCellRegistry, values?: SheetValueSource): string {
  let raw = cellAt(model, r, c);
  if (values && raw.length > 1 && raw[0] === '=') raw = values.valueAt(r, c);
  if (!registry) return raw;
  const type = colTypeAt(model, c);
  const ext = registry.get(type);
  return ext.toText ? ext.toText(raw, { row: r, col: c, type: type ?? 'text' }) : raw;
}

/**
 * The range as tab-separated values. Cells containing tabs, newlines, or
 * quotes are quoted the way spreadsheet TSV expects. Raw strings — the
 * lossless interchange form — unless a `registry` is given, in which case
 * each column type's `toText` supplies the text (a CSV export, search);
 * with `values` too, formula cells export their evaluated value.
 */
export function sheetRangeToTsv(model: SheetModel, range: SheetRange, registry?: SheetCellRegistry, values?: SheetValueSource): string {
  const { r0, c0, r1, c1 } = normalizedRange(model, range);
  const lines: string[] = [];
  for (let r = r0; r <= r1; r++) {
    const cells: string[] = [];
    for (let c = c0; c <= c1; c++) {
      const value = textAt(model, r, c, registry, values);
      cells.push(/[\t\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    }
    lines.push(cells.join('\t'));
  }
  return lines.join('\n');
}

/**
 * The range as a `<table>` clipboard fragment. With a `registry`, cells
 * show their column type's `toHtml` (rich targets get `$1,234.00`) and
 * carry the raw string in `data-raw`, which `sheetFromTable` reads back —
 * so a sheet-to-sheet paste stays lossless.
 */
export function sheetRangeToHtml(model: SheetModel, range: SheetRange, registry?: SheetCellRegistry): string {
  const { r0, c0, r1, c1 } = normalizedRange(model, range);
  const parts: string[] = ['<table><tbody>'];
  for (let r = r0; r <= r1; r++) {
    parts.push('<tr>');
    for (let c = c0; c <= c1; c++) {
      const raw = cellAt(model, r, c);
      if (!registry) {
        parts.push(`<td>${escapeSheetHtml(raw)}</td>`);
        continue;
      }
      const type = colTypeAt(model, c);
      const ext = registry.get(type);
      const ctx = { row: r, col: c, type: type ?? 'text' };
      const html = ext.toHtml ? ext.toHtml(raw, ctx) : escapeSheetHtml(ext.toText ? ext.toText(raw, ctx) : raw);
      parts.push(html === escapeSheetHtml(raw) ? `<td>${html}</td>` : `<td data-raw="${escapeSheetHtml(raw).replace(/"/g, '&quot;')}">${html}</td>`);
    }
    parts.push('</tr>');
  }
  parts.push('</tbody></table>');
  return parts.join('');
}

/**
 * Parse tab-separated text — the inverse of `sheetRangeToTsv`, and what
 * Excel and Google Sheets put on the plain-text clipboard. A quoted cell
 * may carry tabs, newlines, and doubled quotes; a lone trailing newline is
 * not a row. Lines keep their own length (ragged input stays ragged).
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let i = 0;
  const src = text.replace(/\r\n?/g, '\n');
  while (i < src.length) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === '\t') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
    i++;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
