import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  SparkleButtonGroupComponent,
  SparkleDatepickerComponent,
  SparkleDatepickerInputComponent,
  SparkleDateRangeInputComponent,
  SparkleIconComponent,
} from '../../../../../sparkle-ui/src/public-api';

const now = new Date();

@Component({
  selector: 'app-spk-datepicker',
  imports: [
    SparkleDateRangeInputComponent,
    SparkleDatepickerComponent,
    SparkleDatepickerInputComponent,
    SparkleButtonGroupComponent,
    SparkleIconComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './spk-datepicker.component.html',
  styleUrl: './spk-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDatepickerComponent {
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
