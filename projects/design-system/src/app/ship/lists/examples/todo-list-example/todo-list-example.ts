import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipList } from '@ship-ui/core/ship-list';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

@Component({
  selector: 'app-todo-list-example',
  standalone: true,
  imports: [FormsModule, ShipCheckbox, ShipList],
  templateUrl: './todo-list-example.html',
  styleUrls: ['./todo-list-example.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListExample {
  todos = signal<Todo[]>([
    { id: 1, title: 'Review sidenav PR', done: true },
    { id: 2, title: 'Collapse sh-list to icon rail', done: true },
    { id: 3, title: 'Write listbox docs', done: false },
    { id: 4, title: 'Ship 0.26.0', done: false },
  ]);

  doneCount = computed(() => this.todos().filter((todo) => todo.done).length);

  toggle(id: number) {
    this.todos.update((todos) => todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  }
}
