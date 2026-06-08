import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-button-sandbox',
  imports: [ShipButton, ShipButtonGroup, ShipIcon, ShipToggle],
  templateUrl: './button-sandbox.html',
  styleUrl: './button-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSandbox {
  isSmall = signal<boolean>(false);
  isRotated = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isDisabled = signal<boolean>(false);
  isReadonly = signal<boolean>(false);

  sizeClass = signal<'' | 'small' | 'xsmall'>('');
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass() + ' ' + this.sizeClass());
}
