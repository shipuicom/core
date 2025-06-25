import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleRangeSliderComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-readonly-range-slider',
  standalone: true,
  imports: [FormsModule, SparkleRangeSliderComponent],
  templateUrl: './readonly-range-slider.component.html',
  styleUrl: './readonly-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlyRangeSliderComponent {
  value = signal(42);
}
