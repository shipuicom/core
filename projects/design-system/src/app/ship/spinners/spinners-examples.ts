import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { SandboxSpinner } from './examples/sandbox-spinner/sandbox-spinner';

@Component({
  selector: 'app-spinners-examples',
  imports: [Previewer, SandboxSpinner],
  template: `
    <app-previewer path="/spinners/examples/sandbox-spinner/sandbox-spinner" title="Sandbox">
      <app-sandbox-spinner class="example" />
    </app-previewer>
  `,
  styleUrl: './spinners-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpinnersExamples {}
