import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSliderComponent } from 'ship-ui';

@Component({
  selector: 'app-base-range-slider',
  standalone: true,
  imports: [FormsModule, ShipRangeSliderComponent],
  templateUrl: './base-range-slider.component.html',
  styleUrl: './base-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseRangeSliderComponent {
  value = signal(50);
}
