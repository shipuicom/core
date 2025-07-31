import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSliderComponent } from '@ship-ui/core';

@Component({
  selector: 'app-always-show-indicator-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSliderComponent],
  templateUrl: './always-show-indicator-range-slider.component.html',
  styleUrl: './always-show-indicator-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlwaysShowIndicatorRangeSliderComponent {
  value = signal(33);
}
