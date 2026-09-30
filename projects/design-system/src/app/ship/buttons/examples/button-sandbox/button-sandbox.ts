import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-button-sandbox',
  imports: [ShipButton, ShipIcon],
  templateUrl: './button-sandbox.html',
  styleUrl: './button-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  size = input<'' | 'small' | 'xsmall'>('');
  rotated = input(false);
  loading = input(false);
  disabled = input(false);
  readonly = input(false);
  noBg = input(false);
}
