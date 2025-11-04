import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipDatepickerInput } from 'ship-ui';

@Component({
  selector: 'app-input-datepicker-reactive',
  standalone: true,
  imports: [ReactiveFormsModule, ShipDatepickerInput, DatePipe],
  templateUrl: './input-datepicker-reactive.html',
  styleUrl: './input-datepicker-reactive.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDatepickerReactive {
  dateControl = new FormControl(new Date());
}
