import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepicker } from 'ship-ui';

@Component({
  selector: 'app-base-datepicker',
  standalone: true,
  imports: [FormsModule, ShipDatepicker, DatePipe],
  templateUrl: './base-datepicker.component.html',
  styleUrl: './base-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDatepickerComponent {
  selectedDate = signal(new Date());
}
