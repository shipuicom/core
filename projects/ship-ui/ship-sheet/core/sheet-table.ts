// ---------------------------------------------------------------------------
// ShipSheet — <table> (de)serialization
// ---------------------------------------------------------------------------
//
// The document form of a sheet is a real semantic table: published pages get
// styleable markup with zero JS, and any `<table>` — pasted from Excel,
// Google Sheets, or Word — materializes back into a sheet model. Sizes ride
// the legacy `width`/`height` attributes because those survive the editor's
// sanitizer (its style scrub drops dimension properties) and are what
// spreadsheet exports emit anyway.

import { SheetModel, createSheet } from './sheet-model';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Serialize the model as a semantic `<table>` fragment. */
export function sheetToTableHtml(model: SheetModel): string {
  const parts: string[] = ['<table>'];
  if (model.colWidths.some((w) => w !== null)) {
    parts.push('<colgroup>');
    for (const width of model.colWidths) parts.push(width === null ? '<col>' : `<col width="${Math.round(width)}">`);
    parts.push('</colgroup>');
  }
  parts.push('<tbody>');
  for (let r = 0; r < model.rows; r++) {
    const height = model.rowHeights[r];
    parts.push(height === null ? '<tr>' : `<tr height="${Math.round(height)}">`);
    for (let c = 0; c < model.cols; c++) {
      parts.push(`<td>${escapeHtml(model.cells[r * model.cols + c])}</td>`);
    }
    parts.push('</tr>');
  }
  parts.push('</tbody></table>');
  return parts.join('');
}

/**
 * Parse any `<table>` element into a sheet model. Cells spanning columns
 * occupy their first slot and pad the rest with empty cells so the grid stays
 * rectangular; row spans are flattened to their first row. Returns `null`
 * for a table with no rows.
 */
export function sheetFromTable(table: Element): SheetModel | null {
  if (table.tagName?.toLowerCase() !== 'table') return null;

  const rows: string[][] = [];
  const rowHeights: (number | null)[] = [];
  for (const tr of Array.from(table.querySelectorAll('tr'))) {
    // Nested tables parse as their own blocks; skip their rows here.
    if (tr.closest('table') !== table) continue;
    const cells: string[] = [];
    for (const cell of Array.from(tr.children)) {
      const tag = cell.tagName.toLowerCase();
      if (tag !== 'td' && tag !== 'th') continue;
      cells.push(normalizeCellText(cell));
      const span = parseSpan(cell.getAttribute('colspan'));
      for (let i = 1; i < span; i++) cells.push('');
    }
    rows.push(cells);
    rowHeights.push(parseSize(tr.getAttribute('height')));
  }
  if (rows.length === 0) return null;

  const cols = Math.max(1, ...rows.map((r) => r.length));
  const flat: string[] = [];
  for (const row of rows) {
    for (let c = 0; c < cols; c++) flat.push(row[c] ?? '');
  }

  const base = createSheet(rows.length, cols, flat);
  const colWidths = base.colWidths.slice();
  let colIndex = 0;
  for (const col of Array.from(table.querySelectorAll('colgroup > col, table > col'))) {
    if (col.closest('table') !== table) continue;
    const span = parseSpan(col.getAttribute('span'));
    const width = parseSize(col.getAttribute('width'));
    for (let i = 0; i < span && colIndex < cols; i++) colWidths[colIndex++] = width;
  }
  return { ...base, colWidths, rowHeights };
}

/** Cell text with block-ish children joined by newlines and nbsp normalized. */
function normalizeCellText(cell: Element): string {
  const text = cell.textContent ?? '';
  return text.replace(/ /g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').trim();
}

function parseSpan(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 1 ? Math.min(n, 1000) : 1;
}

function parseSize(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/px$/i, ''));
  return Number.isFinite(n) && n > 0 && n <= 10_000 ? n : null;
}
