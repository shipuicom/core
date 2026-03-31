import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createSortableManager, ShipCard, ShipSortable } from 'ship-ui';

@Component({
  selector: 'app-cross-list-sortable',
  standalone: true,
  imports: [ShipSortable, ShipCard],
  templateUrl: './cross-list-sortable.html',
  styleUrl: './cross-list-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossListSortable {
  todoList = signal(['Implement Grids', 'Implement multiple boards', 'Refactor drag drop core']);
  inProgressList = signal(['Write implementation plan', 'Check examples']);
  doneList = signal(['Read documentation', 'Setup ship-ui workspace']);

  manager = createSortableManager({
    todo: this.todoList,
    inProgress: this.inProgressList,
    done: this.doneList,
  });
}
