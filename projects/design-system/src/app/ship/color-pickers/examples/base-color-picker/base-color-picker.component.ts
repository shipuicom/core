import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroupComponent, ShipColorPickerComponent, ShipIcon, ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-base-color-picker',
  imports: [ShipColorPickerComponent, ShipButtonGroupComponent, ShipIcon, ShipToggleComponent],
  templateUrl: './base-color-picker.component.html',
  styleUrl: './base-color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseColorPickerComponent {
  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation'>('hsl');
  aColor = signal<[number, number, number]>([255, 255, 255]);
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);
  showDarkColors = signal(false);
  direction = signal(false);
  selectedHue = signal(0);
}
