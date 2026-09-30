import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ShipDatepicker } from '@ship-ui/core/ship-datepicker';

@Component({
  selector: 'app-datepicker-sandbox',
  standalone: true,
  imports: [ShipDatepicker, DatePipe],
  templateUrl: './datepicker-sandbox.html',
  styleUrl: './datepicker-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerSandbox {
  date = signal<Date | null>(new Date());
  disabled = input(false);
  sharp = input(false);
  /** 0 = Sunday ... 6 = Saturday */
  startOfWeek = input(1);
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');

  exampleClass = computed(() => this.color() + ' ' + (this.sharp() ? 'sharp' : ''));
}
