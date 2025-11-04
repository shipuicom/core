import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-disabled-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './disabled-range-slider.html',
  styleUrl: './disabled-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisabledRangeSlider {
  value = signal(10);
}
