import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SparkleButtonGroupComponent,
  SparkleResizeDirective,
  SparkleSortDirective,
  SparkleStickyColumnsDirective,
  SparkleTableComponent,
  SparkleToggleComponent,
} from '../../../../../sparkle-ui/src/public-api';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 1,
    name: 'HydrogenHydrogenHydrogenHydrogenHydrogenHydrogenHydrogenHydrogenHydrogenHydrogenHydrogen',
    weight: 1.0079,
    symbol: 'H',
  },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

const COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;

type Columns = typeof COLUMNS;
type Column = Columns[number];

@Component({
  selector: 'app-spk-table',
  imports: [
    SparkleTableComponent,
    SparkleButtonGroupComponent,
    SparkleResizeDirective,
    SparkleSortDirective,
    SparkleToggleComponent,
    SparkleStickyColumnsDirective,
  ],
  templateUrl: './spk-table.component.html',
  styleUrl: './spk-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTableComponent {
  displayedColumns = signal<Columns>(COLUMNS);
  withStickyColumns = computed(() => (this.displayedColumns() as any).concat(['hi', 'end']));
  dataSource = signal(ELEMENT_DATA);
  isLoading = signal(true);
  openRowIndex = signal<number | null>(null);
  sortByColumn = signal<Column | `-${Column}` | null>(null);
  typeActive = signal('type-a');
  resizable = signal(true);

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 450);
  }

  toggleRow(index: number) {
    this.openRowIndex.set(index === this.openRowIndex() ? null : index);
  }
}
