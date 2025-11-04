import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepickerInputComponent, ShipFormFieldComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-input-datepicker-ngmodel',
  standalone: true,
  imports: [FormsModule, ShipDatepickerInputComponent, ShipFormFieldComponent, ShipIcon, DatePipe],
  templateUrl: './input-datepicker-ngmodel.component.html',
  styleUrl: './input-datepicker-ngmodel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDatepickerNgModelComponent {
  date = signal<Date | null>(new Date());
  time = signal<`${string}:${string}` | null>(
    `${this.date()?.getHours() ?? '00'}:${this.date()?.getMinutes() ?? '00'}`
  );

  timeEffect = effect(() => {
    const time = this.time();

    if (time === null) return;

    const [hours, minutes, seconds] = time.split(':');

    this.date.update((x) => {
      if (!x) return x;

      const newDate = new Date(x);
      newDate.setHours(parseInt(hours ?? '0'), parseInt(minutes ?? '0'), parseInt(seconds ?? '0'));

      return newDate;
    });
  });
}
