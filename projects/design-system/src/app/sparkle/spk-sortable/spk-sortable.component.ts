import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AfterDropResponse,
  moveIndex,
  SparkleCheckboxComponent,
  SparkleIconComponent,
  SparkleListComponent,
  SparkleSortableDirective,
} from 'spk/public';

const CONTENT_EXAMPLE = [
  {
    id: 'id1',
    header: 'Hello',
    content:
      'hello again, hello againhello againhello againhello againhello againhello againhello againhello againhello againhello againhello againhello again',
  },

  {
    id: 'id2',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id3',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id4',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id5',
    header: 'Hello',
    content: 'hello again',
  },

  {
    id: 'id6',
    header: 'Hello',
    content: 'hello again',
  },
];

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

type ItemType = (typeof CONTENT_EXAMPLE)[0];
type Todo = (typeof TODOS)[0];

@Component({
  selector: 'app-spk-sortable',
  imports: [SparkleListComponent, SparkleCheckboxComponent, SparkleIconComponent, SparkleSortableDirective],
  templateUrl: './spk-sortable.component.html',
  styleUrl: './spk-sortable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSortableComponent {
  items = signal(CONTENT_EXAMPLE);

  ngOnInit() {
    setTimeout(() => {
      this.items.update((items) => items.concat([CONTENT_EXAMPLE[0]]));
    }, 800);
  }

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

  reorder(event: AfterDropResponse) {
    this.items.update((arr) => moveIndex<ItemType>(arr, event));
  }
}
