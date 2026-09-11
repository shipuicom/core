import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipDaterangeInput } from '@ship-ui/core/ship-datepicker';
import { ShipMenu } from '@ship-ui/core/ship-menu';

const DAY = 86400000;

@Component({
  selector: 'app-daterange-menu-example',
  imports: [ShipMenu, ShipButton, ShipDaterangeInput, FormField, DatePipe],
  templateUrl: './daterange-menu-example.html',
  styleUrl: './daterange-menu-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaterangeMenuExample {
  isOpen = signal(false);

  // The daterange input keeps its inputs as parseable date strings, so the
  // signal form model holds strings too.
  range = signal({ start: new Date(Date.now() - 7 * DAY).toDateString(), end: new Date().toDateString() });
  rangeForm = form(this.range);

  applied = signal<{ start: Date | null; end: Date | null }>({
    start: new Date(this.range().start),
    end: new Date(this.range().end),
  });

  presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  applyPreset(days: number) {
    const end = new Date();
    const start = new Date(Date.now() - days * DAY);
    this.range.set({ start: start.toDateString(), end: end.toDateString() });
    this.applied.set({ start, end });
    this.isOpen.set(false);
  }

  applyCustom(range: { start: Date | null; end: Date | null }) {
    if (!range.start || !range.end) return;
    this.applied.set(range);
    this.isOpen.set(false);
  }
}
