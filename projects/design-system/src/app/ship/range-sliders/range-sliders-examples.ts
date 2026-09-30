import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSliderVariant } from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { AlwaysShowIndicatorRangeSlider } from './examples/always-show-indicator-range-slider/always-show-indicator-range-slider';
import { BaseRangeSlider } from './examples/base-range-slider/base-range-slider';
import { DisabledRangeSlider } from './examples/disabled-range-slider/disabled-range-slider';
import { FloatRangeSlider } from './examples/float-range-slider/float-range-slider';
import { LiveUpdatesRangeSlider } from './examples/live-updates-range-slider/live-updates-range-slider';
import { RangeSliderSandbox } from './examples/range-slider-sandbox/range-slider-sandbox';
import { ReactiveRangeSlider } from './examples/reactive-range-slider/reactive-range-slider';
import { ReadonlyRangeSlider } from './examples/readonly-range-slider/readonly-range-slider';
import { SignalFormRangeSlider } from './examples/signal-form-range-slider/signal-form-range-slider';
import { UnitRangeSlider } from './examples/unit-range-slider/unit-range-slider';

@Component({
  selector: 'app-range-sliders-examples',
  imports: [
    FormsModule,
    Previewer,
    ShipButtonGroup,
    ShipFormField,
    ShipToggle,
    RangeSliderSandbox,
    BaseRangeSlider,
    FloatRangeSlider,
    ReactiveRangeSlider,
    SignalFormRangeSlider,
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
export default class RangeSlidersExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  min = signal<number | string>(0);
  max = signal<number | string>(100);
  step = signal<number | string>(1);
  disabled = signal(false);
  readonly = signal(false);
  alwaysShow = signal(false);
  sharp = signal(false);
  unit = signal('%');
  color = signal<'primary' | 'accent' | 'warn' | 'success' | 'error'>('primary');
  variant = signal<ShipRangeSliderVariant | null>(null);
}
