import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseCheckbox } from './examples/base-checkbox/base-checkbox';
import { CheckboxSandbox } from './examples/checkbox-sandbox';
import { FlatCheckbox } from './examples/flat-checkbox/flat-checkbox';
import { OutlinedCheckbox } from './examples/outlined-checkbox/outlined-checkbox';
import { RaisedCheckbox } from './examples/raised-checkbox/raised-checkbox';
import { SignalFormCheckbox } from './examples/signal-form-checkbox/signal-form-checkbox';
import { SimpleCheckbox } from './examples/simple-checkbox/simple-checkbox';

@Component({
  selector: 'app-checkboxes-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    CheckboxSandbox,
    BaseCheckbox,
    SimpleCheckbox,
    OutlinedCheckbox,
    FlatCheckbox,
    RaisedCheckbox,
    SignalFormCheckbox,
  ],
  templateUrl: './checkboxes-examples.html',
  styleUrl: './checkboxes-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxesExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  checked = signal<boolean>(true);
  indeterminate = signal<boolean>(false);
  disabled = signal<boolean>(false);
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
}
