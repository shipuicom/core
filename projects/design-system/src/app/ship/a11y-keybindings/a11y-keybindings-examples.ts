import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicKeybindingsComponent } from './examples/basic-keybindings/basic-keybindings';

@Component({
  selector: 'app-a11y-keybindings-examples',
  imports: [Previewer, BasicKeybindingsComponent],
  template: `
    <app-previewer path="/a11y-keybindings/examples/basic-keybindings/basic-keybindings" title="Interactive Showcase">
      <app-basic-keybindings class="example" />
    </app-previewer>
  `,
  styleUrl: './a11y-keybindings-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsExamples {}
