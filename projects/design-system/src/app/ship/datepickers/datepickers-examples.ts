import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseDatepicker } from './examples/base-datepicker/base-datepicker';
import { DatepickerSandbox } from './examples/datepicker-sandbox/datepicker-sandbox';
import { InputDatepickerNgModelComponent } from './examples/input-datepicker-ngmodel/input-datepicker-ngmodel';
import { InputDatepickerReactive } from './examples/input-datepicker-reactive/input-datepicker-reactive';
import { InputDatepickerSignalForm } from './examples/input-datepicker-signal-form/input-datepicker-signal-form';
import { LiveUpdatesInputDatepicker } from './examples/live-updates-input-datepicker/live-updates-input-datepicker';
import { RangeDatepickerSandbox } from './examples/range-datepicker-sandbox/range-datepicker-sandbox';
import { RangeDatepicker } from './examples/range-datepicker/range-datepicker';
import { RangeInputDatepicker } from './examples/range-input-datepicker/range-input-datepicker';

@Component({
  selector: 'app-datepickers-examples',
  imports: [
    FormsModule,
    Previewer,
    ShipToggle,
    ShipButtonGroup,
    ShipRangeSlider,
    DatepickerSandbox,
    RangeDatepickerSandbox,
    BaseDatepicker,
    RangeDatepicker,
    InputDatepickerNgModelComponent,
    InputDatepickerReactive,
    InputDatepickerSignalForm,
    RangeInputDatepicker,
    LiveUpdatesInputDatepicker,
  ],
  templateUrl: './datepickers-examples.html',
  styleUrl: './datepickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickersExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  disabled = signal(false);
  sharp = signal(false);
  startOfWeek = signal('1');
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');

  // Range sandbox
  rangeDisabled = signal(false);
  rangeColor = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  monthsToShow = signal(2);
}
