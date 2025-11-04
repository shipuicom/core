import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-readonly-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './readonly-range-slider.html',
  styleUrl: './readonly-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlyRangeSlider {
  value = signal(42);
}
