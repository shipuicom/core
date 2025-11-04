import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipDatepickerComponent, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-datepicker-sandbox',
  standalone: true,
  imports: [FormsModule, ShipDatepickerComponent, ShipToggle, ShipButtonGroup, DatePipe],
  templateUrl: './datepicker-sandbox.component.html',
  styleUrl: './datepicker-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerSandboxComponent {
  date = signal<Date | null>(new Date());
  disabled = signal(false);
  sharp = signal(false);
  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');

  exampleClass = computed(() => this.colors() + ' ' + (this.sharp() ? 'sharp' : ''));
}
