import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicScreenreader } from './examples/basic-screenreader/basic-screenreader';

@Component({
  selector: 'app-screenreaders-examples',
  imports: [Previewer, BasicScreenreader],
  template: `
    <app-previewer path="/screenreaders/examples/basic-screenreader/basic-screenreader" title="Screen Reader Simulator">
      <basic-screenreader-example class="example"></basic-screenreader-example>
    </app-previewer>
  `,
  styleUrl: './screenreaders-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ScreenreadersExamples {}
