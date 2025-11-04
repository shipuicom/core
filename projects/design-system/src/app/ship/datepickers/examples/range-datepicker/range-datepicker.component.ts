import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepicker } from 'ship-ui';

@Component({
  selector: 'app-range-datepicker',
  standalone: true,
  imports: [FormsModule, ShipDatepicker, DatePipe],
  templateUrl: './range-datepicker.component.html',
  styleUrl: './range-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeDatepickerComponent {
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
}
