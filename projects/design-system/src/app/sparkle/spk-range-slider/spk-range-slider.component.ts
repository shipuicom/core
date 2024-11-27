import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SparkleIconComponent, SparkleRangeSliderComponent, SparkleToggleComponent } from 'spk/public';

@Component({
  selector: 'app-spk-range-slider',
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
