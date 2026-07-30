import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'app-handle-sortable',
  standalone: true,
  imports: [ShipList, ShipSortable, ShipButton],
  templateUrl: './handle-sortable.html',
  styleUrl: './handle-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandleSortable {
  items = signal(['Task 1: Design Review', 'Task 2: Build Sortables', 'Task 3: Drag Handles', 'Task 4: Publish SDK', 'Task 5: Profit']);
  manager = createSortableManager(this.items);

  /**
   * Gates touch reordering the way an iOS list does. Off, a touch scrolls the
   * page as usual; on, the handles take over and drag instead.
   */
  isEditing = signal(false);

  toggleEditing() {
    this.isEditing.update((editing) => !editing);
  }
}
