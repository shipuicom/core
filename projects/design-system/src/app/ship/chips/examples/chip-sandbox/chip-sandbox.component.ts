import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroup, ShipChip, ShipColorPicker, ShipIcon, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-chip-sandbox',
  imports: [ShipIcon, ShipChip, ShipButtonGroup, ShipToggle, ShipColorPicker],
  templateUrl: './chip-sandbox.component.html',
  styleUrl: './chip-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSandboxComponent {
  isSmall = signal<boolean>(false);
  isSharp = signal<boolean>(false);
  isDynamic = signal<boolean>(false);
  hasIcon = signal<boolean>(true);
  hasSuffixIcon = signal<boolean>(true);
  hasText = signal<boolean>(true);

  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  exampleClass = computed(() => {
    if (this.isDynamic()) return '';

    return this.colorClass() + ' ' + this.variationClass();
  });

  // Color picker
  selectedColor = signal<[number, number, number]>([60, 131, 246]);
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);

  // colorEffect = effect(() => {
  //   if (this.isDynamic()) {
  //     this.currentColor.set({
  //       rgb: 'rgb(132,156,255)',
  //       hex: '#849cff',
  //       hsl: 'hsl(228, 100%, 76%)',
  //       hue: 228,
  //       saturation: 100,
  //     });
  //   }
  // });
}
