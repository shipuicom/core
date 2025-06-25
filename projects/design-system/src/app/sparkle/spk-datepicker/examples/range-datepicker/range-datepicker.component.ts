import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleDatepickerComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-range-datepicker',
  standalone: true,
  imports: [FormsModule, SparkleDatepickerComponent, DatePipe],
  templateUrl: './range-datepicker.component.html',
  styleUrl: './range-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeDatepickerComponent {
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
}
