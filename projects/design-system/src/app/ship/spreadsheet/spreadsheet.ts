import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipEditor, ShipEditorToolbar } from '@ship-ui/core/ship-editor';
import {
  SheetModel,
  SheetOp,
  SheetSelection,
  ShipSpreadsheetBlockBehavior,
  ShipSpreadsheet,
  applySheetOps,
  createSheet,
  primarySheetRange,
  sheetRangeToTsv,
} from '@ship-ui/core/ship-spreadsheet';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';

function sampleSheet(): SheetModel {
  const cells = [
    'Product', 'Q1', 'Q2', 'Q3', 'Q4',
    'Anchor', '1,200', '1,340', '1,510', '1,725',
    'Ballast', '860', '905', '870', '990',
    'Compass', '410', '515', '640', '780',
    'Drift', '95', '120', '180', '260',
  ];
  return applySheetOps(createSheet(5, 5, cells), [
    { kind: 'set-col-width', col: 0, width: 140 },
    { kind: 'set-row-height', row: 0, height: 34 },
  ]).model;
}

/** 50,000 × 200 cells — the window is the only DOM that exists. */
function bigSheet(rows: number, cols: number): SheetModel {
  const cells = new Array<string>(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells[r * cols + c] = `r${r + 1}·c${c + 1}`;
  }
  return createSheet(rows, cols, cells);
}

const EDITOR_DOC = `
<h2>Quarterly numbers</h2>
<p>The table below is a live sheet block — click it to select, drag cells, copy them as TSV.</p>
<table>
  <colgroup><col width="120"><col><col></colgroup>
  <tbody>
    <tr><td>Region</td><td>Units</td><td>Revenue</td></tr>
    <tr><td>North</td><td>1,204</td><td>$48,160</td></tr>
    <tr><td>South</td><td>987</td><td>$39,480</td></tr>
  </tbody>
</table>
<p>Paste a range from Excel or Google Sheets to materialize another one.</p>
`;

@Component({
  selector: 'app-spreadsheet',
  standalone: true,
  imports: [ShipSpreadsheet, ShipEditor, ShipEditorToolbar, Previewer, Highlight],
  templateUrl: './spreadsheet.html',
  styleUrl: './spreadsheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Spreadsheet {
  usageExample = `import { ShipSpreadsheet } from '@ship-ui/core/ship-spreadsheet';

@Component({
  imports: [ShipSpreadsheet],
  template: \`<sh-spreadsheet [sheet]="sheet()" [(selection)]="selection" />\`,
})
export class MyComponent {
  sheet = signal(createSheet(20, 8));
  // Click selects, drag sweeps, Shift+click extends, Cmd/Ctrl+click adds a range.
  selection = signal<SheetSelection | null>(null);
}`;

  blockExample = `import { ShipSpreadsheetBlockBehavior } from '@ship-ui/core/ship-spreadsheet';

// <sh-editor [behaviors]="sheetBehaviors" ...> — any pasted <table> becomes a sheet block.
sheetBehaviors = [new ShipSpreadsheetBlockBehavior()];`;

  editableExample = `<sh-spreadsheet [(sheet)]="sheet" [(selection)]="selection" [editable]="true" (ops)="save($event)" />

// Every user transaction arrives as SheetOp[] — persist it, log it, or relay it.
save(ops: SheetOp[]) { ... }
// Concurrent changes from elsewhere: grid.applyRemote(ops) — not echoed, history rebased.`;

  sample = signal(sampleSheet());
  // Columns B–E are `number` columns (canonical strings in the model, the
  // locale's grouping in the cell); F is `currency`, G `percent`, H `date`
  // (ISO in the model, a date input to edit), I a `checkbox`. Every one is a
  // built-in cell extension interpreting the column's strings.
  editableSheet = signal(
    applySheetOps(sampleSheet(), [
      { kind: 'set-cells', row: 1, col: 1, values: [['1200', '1340', '1510', '1725'], ['860', '905', '870', '990'], ['410', '515', '640', '780'], ['95', '120', '180', '260']] },
      ...[1, 2, 3, 4].map((col): SheetOp => ({ kind: 'set-col-type', col, type: 'number' })),
      { kind: 'insert-cols', at: 5, count: 4 },
      { kind: 'set-cells', row: 0, col: 5, values: [['Unit price', 'Margin', 'Launched', 'Active']] },
      { kind: 'set-col-type', col: 5, type: 'currency' },
      { kind: 'set-col-width', col: 5, width: 96 },
      { kind: 'set-cells', row: 1, col: 5, values: [['19.5'], ['7'], ['42'], ['3.25']] },
      { kind: 'set-col-type', col: 6, type: 'percent' },
      { kind: 'set-cells', row: 1, col: 6, values: [['0.32'], ['0.185'], ['0.41'], ['0.05']] },
      { kind: 'set-col-type', col: 7, type: 'date' },
      { kind: 'set-col-width', col: 7, width: 110 },
      { kind: 'set-cells', row: 1, col: 7, values: [['2024-03-01'], ['2023-11-15'], ['2025-06-30'], ['2026-01-12']] },
      { kind: 'set-col-type', col: 8, type: 'checkbox' },
      { kind: 'set-col-width', col: 8, width: 60 },
      { kind: 'set-cells', row: 1, col: 8, values: [['true'], [''], ['true'], ['']] },
    ]).model
  );

  formatsExample = `import { sheetCurrencyExtension, sheetDateExtension } from '@ship-ui/core/ship-spreadsheet';

// Built in: number, currency (USD), percent, date — host locale. Override with
// a configured instance of the same type through [extensions]:
extensions = [sheetCurrencyExtension({ code: 'DKK', locale: 'da-DK', decimals: 2 }), sheetDateExtension({ locale: 'da-DK' })];`;
  editableSelection = signal<SheetSelection | null>(null);
  lastOps = signal('—');
  onOps(ops: SheetOp[]) {
    this.lastOps.set(JSON.stringify(ops, null, 1));
  }
  sampleSelection = signal<SheetSelection | null>({ ranges: [{ r0: 1, c0: 1, r1: 2, c1: 2 }] });
  readonly sampleTsv = computed(() => {
    const range = primarySheetRange(this.sampleSelection());
    return range ? sheetRangeToTsv(this.sample(), range) : '';
  });
  readonly sampleRangeCount = computed(() => this.sampleSelection()?.ranges.length ?? 0);

  big = signal(bigSheet(50_000, 200));
  bigSelection = signal<SheetSelection | null>(null);
  readonly bigCellCount = computed(() => this.big().rows * this.big().cols);

  sheetBehaviors = [new ShipSpreadsheetBlockBehavior()];
  editorValue = signal(EDITOR_DOC);
}
