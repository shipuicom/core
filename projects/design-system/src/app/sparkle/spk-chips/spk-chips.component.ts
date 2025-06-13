import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SparkleChipComponent,
  SparkleColorPickerComponent,
  SparkleDividerComponent,
  SparkleIconComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-chips',
  imports: [SparkleDividerComponent, SparkleChipComponent, SparkleIconComponent, SparkleColorPickerComponent],
  templateUrl: './spk-chips.component.html',
  styleUrl: './spk-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkChipsComponent {
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);
}
