import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { AlwaysShowIndicatorRangeSliderComponent } from './examples/always-show-indicator-range-slider/always-show-indicator-range-slider.component';
import { BaseRangeSliderComponent } from './examples/base-range-slider/base-range-slider.component';
import { DisabledRangeSliderComponent } from './examples/disabled-range-slider/disabled-range-slider.component';
import { FloatRangeSliderComponent } from './examples/float-range-slider/float-range-slider.component';
import { RangeSliderSandboxComponent } from './examples/range-slider-sandbox/range-slider-sandbox.component';
import { ReactiveRangeSliderComponent } from './examples/reactive-range-slider/reactive-range-slider.component';
import { ReadonlyRangeSliderComponent } from './examples/readonly-range-slider/readonly-range-slider.component';
import { UnitRangeSliderComponent } from './examples/unit-range-slider/unit-range-slider.component';

@Component({
  selector: 'app-spk-range-slider',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BaseRangeSliderComponent,
    ReactiveRangeSliderComponent,
    PreviewerComponent,
    PropertyViewerComponent,
    ReadonlyRangeSliderComponent,
    DisabledRangeSliderComponent,
    UnitRangeSliderComponent,
    AlwaysShowIndicatorRangeSliderComponent,
    RangeSliderSandboxComponent,
    FloatRangeSliderComponent,
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
