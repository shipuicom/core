import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseListExample } from './examples/base-list-example/base-list-example';
import { SwipeListExample } from './examples/swipe-list-example/swipe-list-example';

@Component({
  selector: 'app-lists-examples',
  imports: [Previewer, BaseListExample, SwipeListExample],
  template: `
    <div class="example-list" style="display: flex; flex-direction: column; gap: 32px">
      <app-previewer path="/lists/examples/base-list-example/base-list-example" title="Default">
        <base-list-example class="example" />
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
