import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BaseBlockBehavior, BaseInlineBehavior, SHIP_EDITOR_BLOCK_CONTEXT, ShipEditorBlockContext } from '@ship-ui/core/ship-editor';
import { htmlToAst } from '../ship-editor/editor-serializers';
import { createSheet, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { ShipSpreadsheetBlock, ShipSpreadsheetBlockBehavior } from './spreadsheet-block';

const behavior = new ShipSpreadsheetBlockBehavior();
const blocks = new Map<string, BaseBlockBehavior>([['sheet', behavior]]);
const inlines = new Map<string, BaseInlineBehavior>();

function parse(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return behavior.parseDOM(doc.body.firstElementChild as HTMLElement);
}

describe('ShipSpreadsheetBlockBehavior', () => {
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

describe('ShipSpreadsheetBlock (editable)', () => {
  function mount(initial = sheetToJSON(createSheet(2, 2, ['a', 'b', 'c', 'd']))) {
    const attrs = signal<Record<string, unknown>>({ ...initial });
    const readonly = signal(false);
    const writes: Record<string, unknown>[] = [];
    const ctx: ShipEditorBlockContext = {
      attrs: attrs.asReadonly(),
      index: signal(0).asReadonly(),
      selected: computed(() => false),
      readonly: readonly.asReadonly(),
      // The editor merges the patch and hands the block the serialized result.
      updateAttrs: (patch) => {
        writes.push(patch);
        attrs.set(JSON.parse(JSON.stringify({ ...attrs(), ...patch })));
      },
      select: () => {},
      remove: () => {},
    };
    TestBed.configureTestingModule({ imports: [ShipSpreadsheetBlock], providers: [{ provide: SHIP_EDITOR_BLOCK_CONTEXT, useValue: ctx }] });
    const fixture = TestBed.createComponent(ShipSpreadsheetBlock);
    fixture.detectChanges();
    return { fixture, block: fixture.componentInstance, attrs, readonly, writes };
  }

  it('writes each composer transaction back as one attrs update and keeps its history', () => {
    const { fixture, block, attrs, writes } = mount();
    const grid = block.grid()!;
    grid.apply([{ kind: 'set-cells', row: 0, col: 0, values: [['A']] }]);
    fixture.detectChanges();
    expect(writes).toHaveLength(1);
    expect(sheetFromJSON(attrs())!.cells).toEqual(['A', 'b', 'c', 'd']);
    expect(grid.canUndo()).toBe(true);
    grid.undo();
    fixture.detectChanges();
    expect(writes).toHaveLength(2);
    expect(sheetFromJSON(attrs())!.cells).toEqual(['a', 'b', 'c', 'd']);
  });

  it('a patch names every column so a cleared size does not linger in merged attrs', () => {
    const { fixture, block, attrs, writes } = mount({ ...sheetToJSON(createSheet(1, 2)), colWidths: [120, null] });
    const grid = block.grid()!;
    grid.apply([{ kind: 'set-col-width', col: 0, width: null }]);
    fixture.detectChanges();
    expect(writes[0]).toHaveProperty('colWidths', undefined);
    expect(attrs()['colWidths']).toBeUndefined();
  });

  it('adopts attrs changed from outside without echoing them back', () => {
    const { fixture, block, attrs, writes } = mount();
    attrs.set({ ...sheetToJSON(createSheet(3, 1, ['x', 'y', 'z'])) });
    fixture.detectChanges();
    expect(block.model().rows).toBe(3);
    expect(block.model().cells).toEqual(['x', 'y', 'z']);
    expect(writes).toHaveLength(0);
    expect(block.grid()!.canUndo()).toBe(false);
  });

  it('is read-only when the editor is', () => {
    const { fixture, block, readonly } = mount();
    expect(block.grid()!.editable()).toBe(true);
    readonly.set(true);
    fixture.detectChanges();
    expect(block.grid()!.editable()).toBe(false);
  });
});
