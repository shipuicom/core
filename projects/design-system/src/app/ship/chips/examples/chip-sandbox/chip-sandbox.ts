import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipColorPicker } from '@ship-ui/core/ship-color-picker';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-chip-sandbox',
  imports: [ShipIcon, ShipChip, ShipButtonGroup, ShipToggle, ShipColorPicker],
  templateUrl: './chip-sandbox.html',
  styleUrl: './chip-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSandbox {
  isSmall = signal<boolean>(false);
  isSharp = signal<boolean>(false);
  isDynamic = signal<boolean>(false);
  isNoBg = signal<boolean>(false);
  hasIcon = signal<boolean>(true);
  hasSuffixIcon = signal<boolean>(true);
  hasText = signal<boolean>(true);

  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  sizeClass = computed(() => (this.isSmall() ? 'small' : ''));

  // Color picker
  selectedColor = signal<[number, number, number]>([60, 131, 246]);
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);

  constructor() {
    effect(() => {
      if (this.isNoBg()) {
        const variant = this.variationClass();
        if (variant === 'flat' || variant === 'raised') {
          this.variationClass.set('outlined');
        }
      }
    });
  }
}
