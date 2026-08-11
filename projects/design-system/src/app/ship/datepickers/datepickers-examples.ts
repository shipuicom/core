import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseDatepicker } from './examples/base-datepicker/base-datepicker';
import { DatepickerSandbox } from './examples/datepicker-sandbox/datepicker-sandbox';
import { InputDatepickerNgModelComponent } from './examples/input-datepicker-ngmodel/input-datepicker-ngmodel';
import { InputDatepickerReactive } from './examples/input-datepicker-reactive/input-datepicker-reactive';
import { LiveUpdatesInputDatepicker } from './examples/live-updates-input-datepicker/live-updates-input-datepicker';
import { RangeDatepickerSandbox } from './examples/range-datepicker-sandbox/range-datepicker-sandbox';
import { RangeDatepicker } from './examples/range-datepicker/range-datepicker';
import { RangeInputDatepicker } from './examples/range-input-datepicker/range-input-datepicker';

@Component({
  selector: 'app-datepickers-examples',
  imports: [
    Previewer,
    DatepickerSandbox,
    RangeDatepickerSandbox,
    BaseDatepicker,
    RangeDatepicker,
    InputDatepickerNgModelComponent,
    InputDatepickerReactive,
    RangeInputDatepicker,
    LiveUpdatesInputDatepicker,
  ],
  templateUrl: './datepickers-examples.html',
  styleUrl: './datepickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickersExamples {}
