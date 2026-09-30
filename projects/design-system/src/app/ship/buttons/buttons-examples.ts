import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseButton } from './examples/base-button/base-button';
import { ButtonSandbox } from './examples/button-sandbox/button-sandbox';
import { FlatButton } from './examples/flat-button/flat-button';
import { OutlinedButton } from './examples/outlined-button/outlined-button';
import { RaisedButton } from './examples/raised-button/raised-button';
import { SimpleButton } from './examples/simple-button/simple-button';

@Component({
  selector: 'app-buttons-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    ButtonSandbox,
    BaseButton,
    SimpleButton,
    OutlinedButton,
    FlatButton,
    RaisedButton,
  ],
  templateUrl: './buttons-examples.html',
  styleUrl: './buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  size = signal<'' | 'small' | 'xsmall'>('');
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  rotated = signal(false);
  loading = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  noBg = signal(false);

  constructor() {
    effect(() => {
      if (this.noBg()) {
        const variant = this.variant();
        if (variant === 'flat' || variant === 'raised') {
          this.variant.set('outlined');
        }
      }
    });
  }
}
