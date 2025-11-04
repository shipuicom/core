import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { AlwaysShowIndicatorRangeSlider } from './examples/always-show-indicator-range-slider/always-show-indicator-range-slider';
import { BaseRangeSlider } from './examples/base-range-slider/base-range-slider';
import { DisabledRangeSlider } from './examples/disabled-range-slider/disabled-range-slider';
import { FloatRangeSlider } from './examples/float-range-slider/float-range-slider';
import { RangeSliderSandbox } from './examples/range-slider-sandbox/range-slider-sandbox';
import { ReactiveRangeSlider } from './examples/reactive-range-slider/reactive-range-slider';
import { ReadonlyRangeSlider } from './examples/readonly-range-slider/readonly-range-slider';
import { UnitRangeSlider } from './examples/unit-range-slider/unit-range-slider';

@Component({
  selector: 'app-range-sliders',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BaseRangeSlider,
    ReactiveRangeSlider,
    Previewer,
    PropertyViewer,
    ReadonlyRangeSlider,
    DisabledRangeSlider,
    UnitRangeSlider,
    AlwaysShowIndicatorRangeSlider,
    RangeSliderSandbox,
    FloatRangeSlider,
  ],
  templateUrl: './range-sliders.html',
  styleUrl: './range-sliders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RangeSliders {
  active = signal(false);

  someFloatRangeValue = signal(0.12);
  someRangeValue = signal(50);
  someUndefinedValue = signal(undefined);
  fg = new FormGroup({
    rangeCtrl: new FormControl(50),
  });

  isDisabled = signal(false);
  formCtrl = new FormControl(0.16);

  disabledEffect = effect(() => {
    const isDisabled = this.isDisabled();

    if (isDisabled) {
      this.formCtrl.disable();
    } else {
      this.formCtrl.enable();
    }
  });
  ngOnInit() {
    setTimeout(() => {
      this.someFloatRangeValue.set(0.26);
    }, 1000);
  }
}
