import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-always-show-indicator-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSlider],
  templateUrl: './always-show-indicator-range-slider.component.html',
  styleUrl: './always-show-indicator-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlwaysShowIndicatorRangeSliderComponent {
  value = signal(33);
}
