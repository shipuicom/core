import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  AfterDropResponse,
  moveIndex,
  SparkleCheckboxComponent,
  SparkleIconComponent,
  SparkleListComponent,
  SparkleSortableDirective,
} from '../../../../../sparkle-ui/src/public-api';

const fb = new FormBuilder();

const CONTENT_EXAMPLE = [
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
];

type Todo = (typeof CONTENT_EXAMPLE)[0];
@Component({
  selector: 'app-spk-checkbox',
  imports: [
    SparkleCheckboxComponent,
    SparkleListComponent,
    SparkleSortableDirective,
    SparkleIconComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './spk-checkbox.component.html',
  styleUrl: './spk-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkCheckboxComponent {
  formCtrl = fb.control(true);
  active = signal(false);
  todos = signal(CONTENT_EXAMPLE);

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
