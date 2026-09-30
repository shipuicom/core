import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { ShipRangeSliderVariant } from '@ship-ui/core';

@Component({
  selector: 'app-range-slider-sandbox',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './range-slider-sandbox.html',
  styleUrl: './range-slider-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeSliderSandbox {
  value = signal(50);
  min = input<number | string>(0);
  max = input<number | string>(100);
  step = input<number | string>(1);
  disabled = input(false);
  readonly = input(false);
  alwaysShow = input(false);
  sharp = input(false);
  unit = input('%');
  color = input<'primary' | 'accent' | 'warn' | 'success' | 'error'>('primary');
  variant = input<ShipRangeSliderVariant | null>(null);
}
