import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AfterDropResponse,
  moveIndex,
  SparkleCheckboxComponent,
  SparkleIconComponent,
  SparkleListComponent,
  SparkleSortableDirective,
} from '../../../../../sparkle-ui/src/public-api';

const CONTENT_EXAMPLE = [
  {
    id: 'id1',
    header: 'Hello',
    content: 'hello again',
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

type ItemType = (typeof CONTENT_EXAMPLE)[0];

@Component({
  selector: 'app-spk-sortable',
  standalone: true,
  imports: [SparkleListComponent, SparkleCheckboxComponent, SparkleIconComponent, SparkleSortableDirective],
  templateUrl: './spk-sortable.component.html',
  styleUrl: './spk-sortable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSortableComponent {
  todos = signal([
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
      done: false,
    },
    {
      title: 'Support gap in sorting list ',
      done: false,
    },
  ]);
  items = signal(CONTENT_EXAMPLE);

  ngOnInit() {
    setTimeout(() => {
      this.items.update((items) => items.concat([CONTENT_EXAMPLE[0]]));
    }, 800);
  }

  toggleTodo(index: number) {
    this.todos.update((todos) => {
      todos[index].done = !todos[index].done;

      return todos;
    });
  }

  reorder(event: AfterDropResponse) {
    this.items.update((arr) => moveIndex<ItemType>(arr, event));
  }
}
