import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleDatepickerInputComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-input-datepicker-ngmodel',
  standalone: true,
  imports: [FormsModule, SparkleDatepickerInputComponent, DatePipe],
  templateUrl: './input-datepicker-ngmodel.component.html',
  styleUrl: './input-datepicker-ngmodel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDatepickerNgModelComponent {
  date = signal<Date | null>(new Date());
}
