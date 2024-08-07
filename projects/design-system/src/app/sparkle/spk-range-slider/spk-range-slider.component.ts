import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  SparkleIconComponent,
  SparkleRangeSliderComponent,
  SparkleToggleComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-range-slider',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleRangeSliderComponent, SparkleToggleComponent, SparkleIconComponent, JsonPipe],
  templateUrl: './spk-range-slider.component.html',
  styleUrl: './spk-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkRangeSliderComponent {
  active = signal(false);

  fg = new FormGroup({
    rangeCtrl: new FormControl(50),
  });
}
