import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleRangeSliderComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-unit-range-slider',
  standalone: true,
  imports: [FormsModule, SparkleRangeSliderComponent],
  templateUrl: './unit-range-slider.component.html',
  styleUrl: './unit-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitRangeSliderComponent {
  value = signal(75);
}
