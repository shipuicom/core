import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipDatepicker } from '@ship-ui/core/ship-datepicker';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-range-datepicker-sandbox',
  standalone: true,
  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipRangeSlider, ShipButtonGroup, DatePipe],
  templateUrl: './range-datepicker-sandbox.html',
  styleUrl: './range-datepicker-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeDatepickerSandbox {
  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  startDate = signal<Date | null>(new Date());
  endDate = signal<Date | null>(new Date(Date.now() + 86400000));
  disabled = signal(false);
  monthsToShow = signal(2);
}
