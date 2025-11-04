import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-readonly-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './readonly-range-slider.component.html',
  styleUrl: './readonly-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlyRangeSliderComponent {
  value = signal(42);
}
