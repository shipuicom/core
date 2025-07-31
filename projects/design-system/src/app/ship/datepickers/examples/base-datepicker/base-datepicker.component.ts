import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepickerComponent } from 'ship-ui';

@Component({
  selector: 'app-base-datepicker',
  standalone: true,
  imports: [FormsModule, ShipDatepickerComponent, DatePipe],
  templateUrl: './base-datepicker.component.html',
  styleUrl: './base-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDatepickerComponent {
  selectedDate = signal(new Date());
}
