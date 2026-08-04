import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipEditor, ShipEditorToolbar } from '@ship-ui/core/ship-editor';
import {
  SheetModel,
  SheetSelection,
  ShipSheetBlockBehavior,
  ShipSheetView,
  applySheetOps,
  createSheet,
  primarySheetRange,
  sheetRangeToTsv,
} from '@ship-ui/core/ship-sheet';
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
  selector: 'app-sheet',
  standalone: true,
  imports: [ShipSheetView, ShipEditor, ShipEditorToolbar, Previewer, Highlight],
  templateUrl: './sheet.html',
  styleUrl: './sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sheet {
  usageExample = `import { ShipSheetView } from '@ship-ui/core/ship-sheet';

@Component({
  imports: [ShipSheetView],
  template: \`<sh-sheet-view [sheet]="sheet()" [(selection)]="selection" />\`,
})
export class MyComponent {
  sheet = signal(createSheet(20, 8));
  // Click selects, drag sweeps, Shift+click extends, Cmd/Ctrl+click adds a range.
  selection = signal<SheetSelection | null>(null);
}`;

  blockExample = `import { ShipSheetBlockBehavior } from '@ship-ui/core/ship-sheet';

// <sh-editor [behaviors]="sheetBehaviors" ...> — any pasted <table> becomes a sheet block.
sheetBehaviors = [new ShipSheetBlockBehavior()];`;

  sample = signal(sampleSheet());
  sampleSelection = signal<SheetSelection | null>({ ranges: [{ r0: 1, c0: 1, r1: 2, c1: 2 }] });
  readonly sampleTsv = computed(() => {
    const range = primarySheetRange(this.sampleSelection());
    return range ? sheetRangeToTsv(this.sample(), range) : '';
  });
  readonly sampleRangeCount = computed(() => this.sampleSelection()?.ranges.length ?? 0);

  big = signal(bigSheet(50_000, 200));
  bigSelection = signal<SheetSelection | null>(null);
  readonly bigCellCount = computed(() => this.big().rows * this.big().cols);

  sheetBehaviors = [new ShipSheetBlockBehavior()];
  editorValue = signal(EDITOR_DOC);
}
