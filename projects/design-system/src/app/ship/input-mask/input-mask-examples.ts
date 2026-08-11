import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseInputMaskComponent } from './examples/base-input-mask/base-input-mask';

@Component({
  selector: 'app-input-mask-examples',
  imports: [Previewer, BaseInputMaskComponent],
  template: `
    <app-previewer path="/input-mask/examples/base-input-mask/base-input-mask" title="Default">
      <app-base-input-mask class="example" />
    </app-previewer>
  `,
  styleUrl: './input-mask-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMaskExamples {}
