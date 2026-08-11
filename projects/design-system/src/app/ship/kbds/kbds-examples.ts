import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicKbd } from './examples/basic-kbd/basic-kbd';

@Component({
  selector: 'app-kbds-examples',
  imports: [Previewer, BasicKbd],
  template: `
    <app-previewer path="/kbds/examples/basic-kbd/basic-kbd" title="Basic Keyboard Keys">
      <basic-kbd-example class="example"></basic-kbd-example>
    </app-previewer>
  `,
  styleUrl: './kbds-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KbdsExamples {}
