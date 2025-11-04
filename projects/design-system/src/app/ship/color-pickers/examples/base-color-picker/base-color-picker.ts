import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup, ShipColorPicker, ShipIcon, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-base-color-picker',
  imports: [ShipColorPicker, ShipButtonGroup, ShipIcon, ShipToggle],
  templateUrl: './base-color-picker.html',
  styleUrl: './base-color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseColorPicker {
  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation'>('hsl');
  aColor = signal<[number, number, number]>([255, 255, 255]);
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);
  showDarkColors = signal(false);
  direction = signal(false);
  selectedHue = signal(0);
}
