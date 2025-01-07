import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleButtonGroupComponent,
  SparkleColorPickerComponent,
  SparkleIconComponent,
  SparkleRangeSliderComponent,
  SparkleToggleComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-color-picker',
  imports: [
    JsonPipe,
    SparkleRangeSliderComponent,
    FormsModule,
    SparkleColorPickerComponent,
    SparkleButtonGroupComponent,
    SparkleIconComponent,
    SparkleToggleComponent,
  ],
  templateUrl: './spk-color-picker.component.html',
  styleUrl: './spk-color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkColorPickerComponent {
  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation'>('hsl');
  aColor = signal<[number, number, number]>([255, 255, 255]);
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);
  showDarkColors = signal(false);
  direction = signal(false);
  selectedHue = signal(0);
}
