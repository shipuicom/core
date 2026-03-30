import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AfterDropResponse, moveIndex, ShipSortable } from 'ship-ui';

@Component({
  selector: 'app-grid-sortable-example',
  standalone: true,
  imports: [ShipSortable],
  templateUrl: './grid-sortable-example.html',
  styleUrl: './grid-sortable-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridSortableExample {
  items = signal(Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`));

  reorder(event: AfterDropResponse) {
    this.items.update((arr) => moveIndex(arr, event));
  }
}
