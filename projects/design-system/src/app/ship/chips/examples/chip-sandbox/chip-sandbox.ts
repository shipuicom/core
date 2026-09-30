import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-chip-sandbox',
  imports: [ShipIcon, ShipChip],
  templateUrl: './chip-sandbox.html',
  styleUrl: './chip-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  size = input<'' | 'small'>('');
  sharp = input(false);
  noBg = input(false);
  /** When true, the chip derives its palette from `dynamicColor` (an hsl() string) instead of `color`. */
  dynamic = input(false);
  dynamicColor = input<string | undefined>(undefined);
}
