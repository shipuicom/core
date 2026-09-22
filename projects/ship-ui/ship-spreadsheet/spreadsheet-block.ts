import { ChangeDetectionStrategy, Component, InjectionToken, effect, inject, signal, untracked, viewChild } from '@angular/core';
import {
  BaseComponentBlockBehavior,
  SHIP_EDITOR_BLOCK_CONTEXT,
  SlashCommand,
  SlashCommandCtx,
  escapeAttr,
} from '@ship-ui/core/ship-editor';
import { ASTBlockNode } from '@ship-ui/core/ship-editor';
import { SheetCellExtension } from './core/sheet-extensions';
import { SheetModel, SheetOp, createSheet, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { sheetFromTable, sheetToTableHtml } from './core/sheet-table';
import { ShipSpreadsheet } from './sh-spreadsheet';

/** Cell extensions made available to every embedded sheet block (provide it on the editor's injector). */
export const SHEET_BLOCK_EXTENSIONS = new InjectionToken<readonly SheetCellExtension[]>('SHEET_BLOCK_EXTENSIONS');

/** Attrs patch for a model: every key present, so a merge cannot keep a stale sizes column. */
function attrsPatch(model: SheetModel): Record<string, unknown> {
  const json = sheetToJSON(model);
  return { rows: json.rows, cols: json.cols, cells: json.cells, colWidths: json.colWidths, rowHeights: json.rowHeights, colTypes: json.colTypes };
}

/**
 * The spreadsheet mounted as an `sh-editor` component block. Attrs are the
 * persisted `SheetJSON`; the composer edits a model built from them, and
 * every transaction it emits is written back with `updateAttrs` — one
 * editor transaction per sheet transaction, so the page's history and its
 * collab pipeline see the change as a block update. Attrs that change from
 * outside (editor undo, a remote block splice) are adopted; attrs that
 * merely echo this block's own write are not, so the composer's selection
 * and in-cell history survive the round trip. Escape at the spreadsheet's
 * edge hands control back to the editor.
 */
@Component({
  selector: 'sh-spreadsheet-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShipSpreadsheet],
  styles: `
    :host {
      display: block;
      margin: 12px 0;
    }
    sh-spreadsheet {
      max-height: 420px;
    }
  `,
  template: `<sh-spreadsheet
    [(sheet)]="model"
    [editable]="!ctx.readonly()"
    [extensions]="extensions"
    (ops)="onOps($event)"
    (keydown.escape)="ctx.select()" />`,
})
export class ShipSpreadsheetBlock {
  ctx = inject(SHIP_EDITOR_BLOCK_CONTEXT);
  grid = viewChild(ShipSpreadsheet);
  /** The live model; the source of truth between attrs round trips. */
  model = signal<SheetModel>(createSheet(1, 1));
  /**
   * Cell extensions for embedded sheets. Set through the injector by the
   * host (provide `SHEET_BLOCK_EXTENSIONS`) — until then the built-ins.
   */
  extensions: readonly SheetCellExtension[] = inject(SHEET_BLOCK_EXTENSIONS, { optional: true }) ?? [];
  /** The attrs JSON this block last wrote, to tell an echo from an outside change. */
  #written = '';

  constructor() {
    effect(() => {
      const attrs = this.ctx.attrs();
      const key = JSON.stringify(sheetToJSON(sheetFromJSON(attrs) ?? createSheet(1, 1)));
      if (key === this.#written) return;
      this.#written = key;
      untracked(() => this.model.set(sheetFromJSON(attrs) ?? createSheet(1, 1)));
    });
  }

  /** A composer transaction: the model already advanced; persist it as one editor transaction. */
  onOps(_ops: SheetOp[]): void {
    const model = this.model();
    this.#written = JSON.stringify(sheetToJSON(model));
    this.ctx.updateAttrs(attrsPatch(model));
  }
}

/**
 * Document behavior for the sheet block. The document form is a real
 * semantic `<table>` — published pages get styleable markup with zero JS —
 * and `parseDOM` accepts *any* table element, which is what turns an
 * Excel / Google Sheets / Word paste into a live sheet block.
 */
export class ShipSpreadsheetBlockBehavior extends BaseComponentBlockBehavior {
  readonly type = 'sheet';
  readonly component = ShipSpreadsheetBlock;

  override parseDOM(el: HTMLElement): ASTBlockNode | null {
    if (el.tagName?.toLowerCase() === 'table') {
      const model = sheetFromTable(el);
      return model ? { type: this.type, attrs: { ...sheetToJSON(model) }, content: [] } : null;
    }
    // The neutral div wrapper still parses, for documents serialized before
    // the table form (or through generic component-block tooling).
    return super.parseDOM(el);
  }

  override renderHTML(block: ASTBlockNode): string {
    const model = sheetFromJSON(block.attrs ?? {});
    if (!model) return super.renderHTML(block);
    // The wrapper carries the mount hook and the authoritative attrs; the
    // table inside is the static form — semantic, styleable, zero JS — that
    // published pages keep and the live component replaces when mounted.
    const attrs = escapeAttr(JSON.stringify(sheetToJSON(model)));
    return `<div class="sh-editor-component-block" data-sh-block="${this.type}" data-sh-attrs="${attrs}" contenteditable="false">${sheetToTableHtml(model)}</div>`;
  }

  override slashCommands(): SlashCommand[] {
    return [
      {
        id: 'sheet',
        label: 'Spreadsheet',
        icon: 'table',
        keywords: ['sheet', 'table', 'spreadsheet', 'grid', 'cells'],
        group: 'Widgets',
        run: (c: SlashCommandCtx) => c.engine.insertVoidBlock('sheet', { ...sheetToJSON(createSheet(5, 3)) }),
      },
    ];
  }
}
