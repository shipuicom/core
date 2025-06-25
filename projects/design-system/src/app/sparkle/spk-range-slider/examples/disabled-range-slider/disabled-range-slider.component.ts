import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleRangeSliderComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-disabled-range-slider',
  standalone: true,
  imports: [FormsModule, SparkleRangeSliderComponent],
  templateUrl: './disabled-range-slider.component.html',
  styleUrl: './disabled-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisabledRangeSliderComponent {
  value = signal(10);
}
