import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SparkleRangeSliderComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-reactive-range-slider',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleRangeSliderComponent],
  templateUrl: './reactive-range-slider.component.html',
  styleUrl: './reactive-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveRangeSliderComponent {
  control = new FormControl(25);
}
