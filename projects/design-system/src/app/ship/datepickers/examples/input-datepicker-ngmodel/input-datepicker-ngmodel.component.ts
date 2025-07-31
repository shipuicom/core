import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepickerInputComponent } from '@ship-ui/core';

@Component({
  selector: 'app-input-datepicker-ngmodel',
  standalone: true,
  imports: [FormsModule, ShipDatepickerInputComponent, DatePipe],
  templateUrl: './input-datepicker-ngmodel.component.html',
  styleUrl: './input-datepicker-ngmodel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDatepickerNgModelComponent {
  date = signal<Date | null>(new Date());
}
