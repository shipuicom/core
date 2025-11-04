import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTableComponent } from 'ship-ui';

const ELEMENT_DATA = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
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

@Component({
  selector: 'toggle-row-table',
  standalone: true,
  imports: [ShipTableComponent, ShipIcon, ShipButtonComponent],
  templateUrl: './toggle-row-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleRowTableComponent {
  type = input<string>();
  displayedColumns = signal([...COLUMNS]);
  dataSource = signal([...ELEMENT_DATA]);
  isLoading = signal(true);
  openRowIndex = signal<number | null>(null);

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 450);
  }

  toggleRow(index: number) {
    this.openRowIndex.set(this.openRowIndex() === index ? null : index);
  }
}
