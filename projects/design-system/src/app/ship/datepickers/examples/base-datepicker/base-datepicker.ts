import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepicker } from 'ship-ui';

@Component({
  selector: 'app-base-datepicker',
  standalone: true,
  imports: [FormsModule, ShipDatepicker, DatePipe],
  templateUrl: './base-datepicker.html',
  styleUrl: './base-datepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDatepicker {
  selectedDate = signal(new Date());
}
