import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';

/**
 * Board column headers reordered by dragging them sideways. `shSortableAxis="x"` makes the drop slot
 * follow the pointer's x only, and the handles take ArrowLeft/ArrowRight, Home and End.
 */
@Component({
  selector: 'app-header-sortable',
  standalone: true,
  imports: [ShipSortable, ShipIcon],
  templateUrl: './header-sortable.html',
  styleUrl: './header-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderSortable {
  columns = signal([
    { key: 'todo', name: 'To do', count: 4 },
    { key: 'doing', name: 'Doing', count: 2 },
    { key: 'review', name: 'Review', count: 1 },
    { key: 'done', name: 'Done', count: 7 },
  ]);
  manager = createSortableManager(this.columns);
}
