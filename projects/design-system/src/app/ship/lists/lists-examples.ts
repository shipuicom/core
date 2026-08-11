import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseListExample } from './examples/base-list-example/base-list-example';

@Component({
  selector: 'app-lists-examples',
  imports: [Previewer, BaseListExample],
  template: `
    <app-previewer path="/lists/examples/base-list-example/base-list-example" title="Default">
      <base-list-example class="example" />
    </app-previewer>
  `,
  styleUrl: './lists-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsExamples {}
