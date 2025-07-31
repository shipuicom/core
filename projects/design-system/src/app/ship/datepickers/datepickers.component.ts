import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseDatepickerComponent } from './examples/base-datepicker/base-datepicker.component';
import { DatepickerSandboxComponent } from './examples/datepicker-sandbox/datepicker-sandbox.component';
import { InputDatepickerNgModelComponent } from './examples/input-datepicker-ngmodel/input-datepicker-ngmodel.component';
import { InputDatepickerReactiveComponent } from './examples/input-datepicker-reactive/input-datepicker-reactive.component';
import { RangeDatepickerSandboxComponent } from './examples/range-datepicker-sandbox/range-datepicker-sandbox.component';
import { RangeDatepickerComponent } from './examples/range-datepicker/range-datepicker.component';
import { RangeInputDatepickerComponent } from './examples/range-input-datepicker/range-input-datepicker.component';

const now = new Date();

@Component({
  selector: 'app-datepickers',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BaseDatepickerComponent,
    RangeDatepickerComponent,
    PreviewerComponent,
    InputDatepickerNgModelComponent,
    InputDatepickerReactiveComponent,
    RangeInputDatepickerComponent,
    DatepickerSandboxComponent,
    RangeDatepickerSandboxComponent,
    PropertyViewerComponent,
  ],
  templateUrl: './datepickers.component.html',
  styleUrl: './datepickers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickersComponent {
  someDate = signal(now);
  someOtherDate = signal(new Date('2023-01-01T12:00:00Z')); // Noon UTC
  someRangeDate = signal(new Date('2023-01-01T22:00:00Z')); // 11PM UTC
  someEndRangeDate = signal(null);

  startDateControl = new FormControl(new Date('2023-01-01T12:00:00Z')); // Noon UTC
  endDateControl = new FormControl(new Date('2023-01-01T22:00:00Z')); // 11PM UTC

  type = signal<'none' | 'raised' | 'outlined'>('none');
  colors = signal<'none' | 'primary' | 'accent' | 'error' | 'warn' | 'success'>('primary');

  data = input<any>();
  closed = output<boolean>();

  someDateCtrl = new FormControl(now);

  myDate = signal(now);

  close() {
    this.closed.emit(true);
  }

  class = computed(() => {
    return `${this.type()} ${this.colors()}`;
  });

  updateTimeUTC(hh: number, mm: number, ss: number) {
    this.someOtherDate.set(
      new Date(
        Date.UTC(
          this.someOtherDate().getUTCFullYear(),
          this.someOtherDate().getUTCMonth(),
          this.someOtherDate().getUTCDate(),
          hh,
          mm,
          ss
        )
      )
    );
  }

  ngOnInit() {
    console.log('now: ', now);
    setTimeout(() => {
      this.updateTimeUTC(0, 0, 0);
    }, 500);
    setTimeout(() => {
      this.updateTimeUTC(5, 34, 23);
    }, 2000);
    setTimeout(() => {
      this.updateTimeUTC(-2, 0, 0);
    }, 4500);
  }
}
