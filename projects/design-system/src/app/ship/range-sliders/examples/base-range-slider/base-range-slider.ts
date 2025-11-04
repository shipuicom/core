import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-base-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './base-range-slider.html',
  styleUrl: './base-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseRangeSlider {
  value = signal(50);
}
