import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ShipDatepickerInput } from '@ship-ui/core/ship-datepicker';

@Component({
  selector: 'app-input-datepicker-signal-form',
  imports: [FormField, ShipDatepickerInput, DatePipe],
  templateUrl: './input-datepicker-signal-form.html',
  styleUrl: './input-datepicker-signal-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDatepickerSignalForm {
  // Signal forms bind text inputs as strings; the datepicker keeps the input
  // value as a parseable date string, so the model holds that string.
  date = signal(new Date().toDateString());
  dateForm = form(this.date, (path) => {
    required(path, { message: 'Pick a date' });
  });
}
