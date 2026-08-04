import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  BaseComponentBlockBehavior,
  SHIP_EDITOR_BLOCK_CONTEXT,
  SlashCommand,
  SlashCommandCtx,
  escapeAttr,
} from '@ship-ui/core/ship-editor';
import { ASTBlockNode } from '@ship-ui/core/ship-editor';
import { SheetModel, createSheet, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { sheetFromTable, sheetToTableHtml } from './core/sheet-table';
import { ShipSheetView } from './sh-sheet-view';

/**
 * The sheet mounted as an `sh-editor` component block. Attrs are the
 * persisted `SheetJSON`; the read-only view renders them, and Escape at the
 * sheet's edge hands control back to the editor. The editable upgrade swaps
 * the view for the composing `ShipSheet` without touching this contract.
 */
@Component({
  selector: 'sh-sheet-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShipSheetView],
  styles: `
    :host {
      display: block;
      margin: 12px 0;
    }
    sh-sheet-view {
      max-height: 420px;
    }
  `,
  template: `<sh-sheet-view [sheet]="sheet()" (keydown.escape)="ctx.select()" />`,
})
export class ShipSheetBlock {
  ctx = inject(SHIP_EDITOR_BLOCK_CONTEXT);
  sheet = computed<SheetModel>(() => sheetFromJSON(this.ctx.attrs()) ?? createSheet(1, 1));
}

/**
 * Document behavior for the sheet block. The document form is a real
 * semantic `<table>` — published pages get styleable markup with zero JS —
 * and `parseDOM` accepts *any* table element, which is what turns an
 * Excel / Google Sheets / Word paste into a live sheet block.
 */
export class ShipSheetBlockBehavior extends BaseComponentBlockBehavior {
  readonly type = 'sheet';
  readonly component = ShipSheetBlock;

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
        label: 'Sheet',
        icon: 'table',
        keywords: ['sheet', 'table', 'spreadsheet', 'grid', 'cells'],
        group: 'Widgets',
        run: (c: SlashCommandCtx) => c.engine.insertVoidBlock('sheet', { ...sheetToJSON(createSheet(5, 3)) }),
      },
    ];
  }
}
