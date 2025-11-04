import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipDaterangeInput, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-range-input-datepicker',
  standalone: true,
  imports: [ReactiveFormsModule, ShipDaterangeInput, ShipIcon, DatePipe],
  templateUrl: './range-input-datepicker.html',
  styleUrl: './range-input-datepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeInputDatepicker {
  startDate = new FormControl(new Date());
  endDate = new FormControl(new Date(Date.now() + 86400000)); // Tomorrow
}
