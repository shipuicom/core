import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseToggle } from './examples/base-toggle/base-toggle';
import { FlatToggle } from './examples/flat-toggle/flat-toggle';
import { OutlinedToggle } from './examples/outlined-toggle/outlined-toggle';
import { RaisedToggle } from './examples/raised-toggle/raised-toggle';
import { SignalFormToggle } from './examples/signal-form-toggle/signal-form-toggle';
import { SimpleToggle } from './examples/simple-toggle/simple-toggle';
import { ToggleSandbox } from './examples/toggle-sandbox';

@Component({
  selector: 'app-toggles-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    ToggleSandbox,
    BaseToggle,
    SimpleToggle,
    OutlinedToggle,
    FlatToggle,
    RaisedToggle,
    SignalFormToggle,
  ],
  templateUrl: './toggles-examples.html',
  styleUrl: './toggles-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TogglesExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  checked = signal(true);
  disabled = signal(false);
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
}
