import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseListExample } from './examples/base-list-example/base-list-example';
import { CollapsedListExample } from './examples/collapsed-list-example/collapsed-list-example';
import { SelectListExample } from './examples/select-list-example/select-list-example';
import { TodoListExample } from './examples/todo-list-example/todo-list-example';
import { SwipeListExample } from './examples/swipe-list-example/swipe-list-example';

@Component({
  selector: 'app-lists-examples',
  imports: [Previewer, BaseListExample, CollapsedListExample, SelectListExample, TodoListExample, SwipeListExample],
  template: `
    <div class="example-list" style="display: flex; flex-direction: column; gap: 32px">
      <app-previewer path="/lists/examples/base-list-example/base-list-example" title="Default">
        <base-list-example class="example" />
      </app-previewer>

      <app-previewer path="/lists/examples/collapsed-list-example/collapsed-list-example" title="Collapsed">
        <app-collapsed-list-example class="example" />
      </app-previewer>

      <app-previewer path="/lists/examples/select-list-example/select-list-example" title="Selection">
        <app-select-list-example class="example" />
      </app-previewer>

      <app-previewer path="/lists/examples/todo-list-example/todo-list-example" title="Todos">
        <app-todo-list-example class="example" />
      </app-previewer>

      <app-previewer path="/lists/examples/swipe-list-example/swipe-list-example" title="Swipe Actions">
        <app-swipe-list-example class="example" />
      </app-previewer>
    </div>
  `,
  styleUrl: './lists-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsExamples {}
