import { describe, expect, it } from 'vitest';
import { BaseBlockBehavior, BaseInlineBehavior } from '@ship-ui/core/ship-editor';
import { htmlToAst } from '../ship-editor/editor-serializers';
import { createSheet, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { ShipSheetBlockBehavior } from './sheet-block';

const behavior = new ShipSheetBlockBehavior();
const blocks = new Map<string, BaseBlockBehavior>([['sheet', behavior]]);
const inlines = new Map<string, BaseInlineBehavior>();

function parse(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return behavior.parseDOM(doc.body.firstElementChild as HTMLElement);
}

describe('ShipSheetBlockBehavior', () => {
  it('serializes attrs as a real table and parses it back losslessly', () => {
    const attrs = { ...sheetToJSON(createSheet(2, 2, ['a', 'b', 'c', 'd'])), colWidths: [80, null] };
    const html = behavior.renderHTML({ type: 'sheet', attrs, content: [] });
    expect(html).toContain('data-sh-block="sheet"');
    expect(html).toContain('<table>');
    expect(html).toContain('<col width="80">');
    const parsed = parse(html);
    expect(parsed?.type).toBe('sheet');
    expect(sheetFromJSON(parsed!.attrs)).toEqual(sheetFromJSON(attrs));
  });

  it('still parses the neutral div wrapper form', () => {
    const attrs = sheetToJSON(createSheet(1, 1, ['x']));
    const parsed = parse(`<div data-sh-block="sheet" data-sh-attrs='${JSON.stringify(attrs)}'></div>`);
    expect(parsed?.type).toBe('sheet');
    expect(sheetFromJSON(parsed!.attrs)).toEqual(sheetFromJSON(attrs));
  });

  it('rejects non-table, non-wrapper elements', () => {
    expect(parse('<p>text</p>')).toBeNull();
    expect(parse('<table></table>')).toBeNull();
  });

  it('materializes a pasted spreadsheet table through the sanitize + parse pipeline', () => {
    // Google-Sheets-flavored paste: style noise, colgroup widths, th header.
    const pasted = `
      <table style="border-collapse:collapse" onclick="alert(1)">
        <colgroup><col width="100"><col width="150"></colgroup>
        <tbody>
          <tr><th style="font-weight:bold">Name</th><th>Score</th></tr>
          <tr><td>alice</td><td>97</td></tr>
        </tbody>
      </table>`;
    const doc = htmlToAst(pasted, blocks, inlines);
    expect(doc).toHaveLength(1);
    expect(doc[0].type).toBe('sheet');
    const model = sheetFromJSON(doc[0].attrs)!;
    expect(model.rows).toBe(2);
    expect(model.cells).toEqual(['Name', 'Score', 'alice', '97']);
    expect(model.colWidths).toEqual([100, 150]);
  });
});
