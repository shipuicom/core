// ---------------------------------------------------------------------------
// ShipSpreadsheet — clipboard flavors
// ---------------------------------------------------------------------------
//
// Copy-out writes two flavors: TSV for text targets (terminals, plain
// editors, spreadsheet paste) and a `<table>` fragment for rich targets —
// the same pairing Excel and Google Sheets put on the clipboard.

import { SheetModel, SheetRange, cellAt, normalizedRange } from './sheet-model';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The range as tab-separated values. Cells containing tabs, newlines, or
 * quotes are quoted the way spreadsheet TSV expects.
 */
export function sheetRangeToTsv(model: SheetModel, range: SheetRange): string {
  const { r0, c0, r1, c1 } = normalizedRange(model, range);
  const lines: string[] = [];
  for (let r = r0; r <= r1; r++) {
    const cells: string[] = [];
    for (let c = c0; c <= c1; c++) {
      const value = cellAt(model, r, c);
      cells.push(/[\t\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    }
    lines.push(cells.join('\t'));
  }
  return lines.join('\n');
}

/** The range as a `<table>` clipboard fragment. */
export function sheetRangeToHtml(model: SheetModel, range: SheetRange): string {
  const { r0, c0, r1, c1 } = normalizedRange(model, range);
  const parts: string[] = ['<table><tbody>'];
  for (let r = r0; r <= r1; r++) {
    parts.push('<tr>');
    for (let c = c0; c <= c1; c++) parts.push(`<td>${escapeHtml(cellAt(model, r, c))}</td>`);
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
