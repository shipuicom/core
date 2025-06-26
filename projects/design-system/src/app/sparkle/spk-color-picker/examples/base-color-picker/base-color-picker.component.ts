import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SparkleButtonGroupComponent,
  SparkleColorPickerComponent,
  SparkleIconComponent,
  SparkleToggleComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-color-picker',
  imports: [SparkleColorPickerComponent, SparkleButtonGroupComponent, SparkleIconComponent, SparkleToggleComponent],
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
