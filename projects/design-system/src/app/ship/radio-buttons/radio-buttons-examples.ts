import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseRadio } from './examples/base-radio/base-radio';
import { FlatRadio } from './examples/flat-radio/flat-radio';
import { OutlinedRadio } from './examples/outlined-radio/outlined-radio';
import { RadioSandbox } from './examples/radio-sandbox';
import { RaisedRadio } from './examples/raised-radio/raised-radio';
import { SignalFormRadio } from './examples/signal-form-radio/signal-form-radio';
import { SimpleRadio } from './examples/simple-radio/simple-radio';

@Component({
  selector: 'app-radio-buttons-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    RadioSandbox,
    BaseRadio,
    SimpleRadio,
    OutlinedRadio,
    FlatRadio,
    RaisedRadio,
    SignalFormRadio,
  ],
  templateUrl: './radio-buttons-examples.html',
  styleUrl: './radio-buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtonsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  disabled = signal(false);
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
}
