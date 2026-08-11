import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { AlwaysShowIndicatorRangeSlider } from './examples/always-show-indicator-range-slider/always-show-indicator-range-slider';
import { BaseRangeSlider } from './examples/base-range-slider/base-range-slider';
import { DisabledRangeSlider } from './examples/disabled-range-slider/disabled-range-slider';
import { FloatRangeSlider } from './examples/float-range-slider/float-range-slider';
import { LiveUpdatesRangeSlider } from './examples/live-updates-range-slider/live-updates-range-slider';
import { RangeSliderSandbox } from './examples/range-slider-sandbox/range-slider-sandbox';
import { ReactiveRangeSlider } from './examples/reactive-range-slider/reactive-range-slider';
import { ReadonlyRangeSlider } from './examples/readonly-range-slider/readonly-range-slider';
import { UnitRangeSlider } from './examples/unit-range-slider/unit-range-slider';

@Component({
  selector: 'app-range-sliders-examples',
  imports: [
    Previewer,
    RangeSliderSandbox,
    BaseRangeSlider,
    FloatRangeSlider,
    ReactiveRangeSlider,
    ReadonlyRangeSlider,
    UnitRangeSlider,
    AlwaysShowIndicatorRangeSlider,
    DisabledRangeSlider,
    LiveUpdatesRangeSlider,
  ],
  templateUrl: './range-sliders-examples.html',
  styleUrl: './range-sliders-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RangeSlidersExamples {}
