import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createSortableManager, ShipList, ShipSortable } from 'ship-ui';

@Component({
  selector: 'app-handle-sortable',
  standalone: true,
  imports: [ShipList, ShipSortable],
  templateUrl: './handle-sortable.html',
  styleUrl: './handle-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandleSortable {
  items = signal(['Task 1: Design Review', 'Task 2: Build Sortables', 'Task 3: Drag Handles', 'Task 4: Publish SDK', 'Task 5: Profit']);
  manager = createSortableManager(this.items);
}
