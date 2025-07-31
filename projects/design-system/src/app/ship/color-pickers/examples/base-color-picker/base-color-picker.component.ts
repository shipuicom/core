import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ShipButtonGroupComponent,
  ShipColorPickerComponent,
  ShipIconComponent,
  ShipToggleComponent,
} from '@ship-ui/core';

@Component({
  selector: 'app-base-color-picker',
  imports: [ShipColorPickerComponent, ShipButtonGroupComponent, ShipIconComponent, ShipToggleComponent],
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
