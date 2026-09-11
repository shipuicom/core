import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseInputMaskComponent } from './examples/base-input-mask/base-input-mask';
import { SignalFormInputMask } from './examples/signal-form-input-mask/signal-form-input-mask';

@Component({
  selector: 'app-input-mask-examples',
  imports: [Previewer, BaseInputMaskComponent, SignalFormInputMask],
  template: `
    <app-previewer path="/input-mask/examples/base-input-mask/base-input-mask" title="Default">
      <app-base-input-mask class="example" />
    </app-previewer>

    <app-previewer path="/input-mask/examples/signal-form-input-mask/signal-form-input-mask" title="Signal Forms">
      <app-signal-form-input-mask class="example" />
    </app-previewer>
  `,
  styleUrl: './input-mask-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMaskExamples {}
