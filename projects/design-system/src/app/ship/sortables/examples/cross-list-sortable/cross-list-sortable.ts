import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AfterDropResponse, CrossDropResponse, moveIndex, ShipCard, ShipSortable, transferArrayItem } from 'ship-ui';

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

  reorderTodo(event: AfterDropResponse) {
    this.todoList.update((arr) => moveIndex(arr, event));
  }

  reorderInProgress(event: AfterDropResponse) {
    this.inProgressList.update((arr) => moveIndex(arr, event));
  }

  reorderDone(event: AfterDropResponse) {
    this.doneList.update((arr) => moveIndex(arr, event));
  }

  crossDropTodo(event: CrossDropResponse) {
    const sourceData = event.previousContainer.sortableData();
    this.todoList.update((arr) => {
      transferArrayItem(sourceData, arr, event.previousIndex, event.currentIndex);
      return [...arr];
    });
  }

  crossDropInProgress(event: CrossDropResponse) {
    const sourceData = event.previousContainer.sortableData();
    this.inProgressList.update((arr) => {
      transferArrayItem(sourceData, arr, event.previousIndex, event.currentIndex);
      return [...arr];
    });
  }

  crossDropDone(event: CrossDropResponse) {
    const sourceData = event.previousContainer.sortableData();
    this.doneList.update((arr) => {
      transferArrayItem(sourceData, arr, event.previousIndex, event.currentIndex);
      return [...arr];
    });
  }
}
