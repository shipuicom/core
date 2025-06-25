import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleButtonGroupComponent,
  SparkleDatepickerComponent,
  SparkleToggleComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-datepicker-sandbox',
  standalone: true,
  imports: [FormsModule, SparkleDatepickerComponent, SparkleToggleComponent, SparkleButtonGroupComponent, DatePipe],
  templateUrl: './datepicker-sandbox.component.html',
  styleUrl: './datepicker-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerSandboxComponent {
  date = signal<Date | null>(new Date());
  disabled = signal(false);
  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
}
