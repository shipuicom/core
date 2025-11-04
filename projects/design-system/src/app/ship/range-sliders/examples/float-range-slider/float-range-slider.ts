import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-float-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider, DecimalPipe],
  templateUrl: './float-range-slider.html',
  styleUrl: './float-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatRangeSlider {
  value = signal(0.12);
}
