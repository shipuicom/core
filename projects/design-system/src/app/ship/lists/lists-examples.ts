import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { BaseListExample } from './examples/base-list-example/base-list-example';
import { CollapsedListExample } from './examples/collapsed-list-example/collapsed-list-example';
import { ListSandbox, ListSandboxColor, ListSandboxVariant } from './examples/list-sandbox/list-sandbox';
import { NavListExample } from './examples/nav-list-example/nav-list-example';
import { SelectListExample } from './examples/select-list-example/select-list-example';
import { TodoListExample } from './examples/todo-list-example/todo-list-example';
import { SwipeListExample } from './examples/swipe-list-example/swipe-list-example';

@Component({
  selector: 'app-lists-examples',
  imports: [Previewer, ShipButtonGroup, ListSandbox, BaseListExample, CollapsedListExample, NavListExample, SelectListExample, TodoListExample, SwipeListExample],
  template: `
    <div class="example-list" style="display: flex; flex-direction: column; gap: 32px">
      <app-previewer path="/lists/examples/list-sandbox/list-sandbox" title="Sandbox" class="no-space">
        <ng-container controls>
          <sh-button-group class="small" [(value)]="variant">
            <button value="">Default</button>
            <button value="base-1">Base 1</button>
            <button value="outlined">Outlined</button>
            <button value="type-b">Type B</button>
            <button value="type-c">Type C</button>
          </sh-button-group>
          <sh-button-group class="small" [(value)]="color">
            <button value="">Default</button>
            <button value="primary">Primary</button>
            <button value="accent">Accent</button>
            <button value="warn">Warn</button>
            <button value="error">Error</button>
            <button value="success">Success</button>
          </sh-button-group>
          <sh-button-group class="small" [(value)]="layout">
            <button value="expanded">Expanded</button>
            <button value="collapsed">Collapsed</button>
          </sh-button-group>
        </ng-container>

        <app-list-sandbox [variant]="variant()" [color]="color()" [collapsed]="layout() === 'collapsed'" />
      </app-previewer>

      <app-previewer path="/lists/examples/base-list-example/base-list-example" title="Default">
        <base-list-example class="example" />
      </app-previewer>

      <app-previewer path="/lists/examples/collapsed-list-example/collapsed-list-example" title="Collapsed">
        <app-collapsed-list-example class="example" />
      </app-previewer>

      <app-previewer path="/lists/examples/nav-list-example/nav-list-example" title="Navigation rows">
        <app-nav-list-example class="example" />
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
export default class ListsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  variant = signal<ListSandboxVariant>('');
  color = signal<ListSandboxColor>('');
  layout = signal<'expanded' | 'collapsed'>('expanded');
}
