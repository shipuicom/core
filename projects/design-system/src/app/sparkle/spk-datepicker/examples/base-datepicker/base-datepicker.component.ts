import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleDatepickerComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-datepicker',
  standalone: true,
  imports: [FormsModule, SparkleDatepickerComponent, DatePipe],
  templateUrl: './base-datepicker.component.html',
  styleUrl: './base-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDatepickerComponent {
  selectedDate = signal(new Date());
}
