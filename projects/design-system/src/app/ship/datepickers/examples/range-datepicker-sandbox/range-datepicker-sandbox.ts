import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipDatepicker } from '@ship-ui/core/ship-datepicker';

@Component({
  selector: 'app-range-datepicker-sandbox',
  standalone: true,
  imports: [ShipDatepicker, DatePipe],
  templateUrl: './range-datepicker-sandbox.html',
  styleUrl: './range-datepicker-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeDatepickerSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  disabled = input(false);
  monthsToShow = input(2);

  startDate = signal<Date | null>(new Date());
  endDate = signal<Date | null>(new Date(Date.now() + 86400000));
}
