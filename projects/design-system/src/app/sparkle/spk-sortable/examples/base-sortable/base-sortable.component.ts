import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AfterDropResponse,
  moveIndex,
  SparkleCheckboxComponent,
  SparkleIconComponent,
  SparkleListComponent,
  SparkleSortableDirective,
} from '../../../../../../../sparkle-ui/src/public-api';

const TODOS = [
  {
    title: 'Simple sorting of list',
    done: true,
  },
  {
    title: 'Sorting animation',
    done: true,
  },
  {
    title: 'Support sortable handle',
    done: true,
  },
  {
    title: 'Support gap in sorting list ',
    done: true,
  },
  {
    title: 'Support placeholder',
    done: true,
  },
  {
    title: 'Support animation only when dragging',
    done: true,
  },
  {
    title: 'Support multiple lists',
    done: false,
  },
  {
    title: 'Support draggable grids',
    done: false,
  },
];

type Todo = (typeof TODOS)[0];

@Component({
  selector: 'app-base-sortable',
  standalone: true,
  imports: [SparkleListComponent, SparkleSortableDirective, SparkleIconComponent, SparkleCheckboxComponent],
  templateUrl: './base-sortable.component.html',
  styleUrl: './base-sortable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseSortableComponent {
  todos = signal(TODOS);

  toggleTodo(index: number) {
    this.todos.update((todos) => {
      todos[index].done = !todos[index].done;

      return todos;
    });
  }

  reorderTodo(event: AfterDropResponse) {
    this.todos.update((arr) => moveIndex<Todo>(arr, event));
  }
}
