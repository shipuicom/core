import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';

@Component({
  selector: 'app-unit-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './unit-range-slider.html',
  styleUrl: './unit-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitRangeSlider {
  value = signal(75);
}
