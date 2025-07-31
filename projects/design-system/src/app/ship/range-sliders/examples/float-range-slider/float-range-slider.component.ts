import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSliderComponent } from 'ship-ui';

@Component({
  selector: 'app-float-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSliderComponent, DecimalPipe],
  templateUrl: './float-range-slider.component.html',
  styleUrl: './float-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatRangeSliderComponent {
  value = signal(0.12);
}
