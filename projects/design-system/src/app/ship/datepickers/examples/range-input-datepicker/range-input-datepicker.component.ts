import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipDateRangeInputComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-range-input-datepicker',
  standalone: true,
  imports: [ReactiveFormsModule, ShipDateRangeInputComponent, ShipIconComponent, DatePipe],
  templateUrl: './range-input-datepicker.component.html',
  styleUrl: './range-input-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeInputDatepickerComponent {
  startDate = new FormControl(new Date());
  endDate = new FormControl(new Date(Date.now() + 86400000)); // Tomorrow
}
