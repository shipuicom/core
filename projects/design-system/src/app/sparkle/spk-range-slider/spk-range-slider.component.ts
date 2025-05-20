import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  SparkleIconComponent,
  SparkleRangeSliderComponent,
  SparkleToggleComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-range-slider',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SparkleRangeSliderComponent,
    SparkleToggleComponent,
    SparkleIconComponent,
  ],
  templateUrl: './spk-range-slider.component.html',
  styleUrl: './spk-range-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkRangeSliderComponent {
  active = signal(false);

  someFloatRangeValue = signal(0.12);
  someRangeValue = signal(50);
  someUndefinedValue = signal(undefined);
  fg = new FormGroup({
    rangeCtrl: new FormControl(50),
  });

  formCtrl = new FormControl(0.16);

  ngOnInit() {
    setTimeout(() => {
      this.someFloatRangeValue.set(0.26);
    }, 1000);
  }
}
