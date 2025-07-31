import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipDatepickerInputComponent } from '@ship-ui/core';

@Component({
  selector: 'app-input-datepicker-reactive',
  standalone: true,
  imports: [ReactiveFormsModule, ShipDatepickerInputComponent, DatePipe],
  templateUrl: './input-datepicker-reactive.component.html',
  styleUrl: './input-datepicker-reactive.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDatepickerReactiveComponent {
  dateControl = new FormControl(new Date());
}
