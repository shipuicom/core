import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createSortableManager, ShipSortable } from 'ship-ui';

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


  manager = createSortableManager(this.items);
}
