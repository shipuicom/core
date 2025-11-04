import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipDatepickerComponent, ShipRangeSliderComponent, ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-range-datepicker-sandbox',
  standalone: true,
  imports: [
    FormsModule,
    ShipDatepickerComponent,
    ShipToggleComponent,
    ShipRangeSliderComponent,
    ShipButtonGroup,
    DatePipe,
  ],
  templateUrl: './range-datepicker-sandbox.component.html',
  styleUrl: './range-datepicker-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeDatepickerSandboxComponent {
  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  startDate = signal<Date | null>(new Date());
  endDate = signal<Date | null>(new Date(Date.now() + 86400000));
  disabled = signal(false);
  monthsToShow = signal(2);
}
