import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-datepickers-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './datepickers-service.html',
  styleUrl: './datepickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickersService {
  codeProvide = `import { Component, inject } from '@angular/core';
import { ShipCalendarService } from '@ship-ui/core';

@Component({
  selector: 'app-booking-calendar',
  // Not provided in root — each calendar view owns its instance
  providers: [ShipCalendarService],
  templateUrl: './booking-calendar.html',
})
export class BookingCalendar {
  calendar = inject(ShipCalendarService);

  constructor() {
    this.calendar.monthsToShow.set(2);   // side-by-side months
    this.calendar.startOfWeek.set(1);    // 0 = Sunday, 1 = Monday
    this.calendar.locale.set('da-DK');   // Intl-based month/weekday names
  }
}`;

  codeRender = `<!-- months() yields one entry per visible month with a padded 7-column grid -->
@for (month of calendar.months(); track month.date) {
  <h4>{{ calendar.getMonthName(month.date) }} {{ calendar.getFullYear(month.date) }}</h4>

  <div class="weekdays">
    @for (day of calendar.weekdays(); track day) {
      <span>{{ day }}</span>
    }
  </div>

  <div class="grid">
    @for (date of month.dates; track date) {
      <button [attr.aria-label]="calendar.getAriaLabel(date)" [disabled]="!calendar.isCurrentMonth(date, 0)">
        {{ date.getDate() }}
      </button>
    }
  </div>
}`;

  codeNavigate = `// Month navigation (updates the reactive months() grid)
calendar.nextMonth();
calendar.previousMonth();
calendar.goToMonth(new Date(2026, 11, 1));

// Scroll the view so a date is visible without jumping when it already is
calendar.ensureDateVisible(someDate);`;

  codeHelpers = `calendar.isSameDay(a, b);          // date-only comparison, null-safe
calendar.addDays(date, 7);
calendar.addMonths(date, -1);
calendar.addYears(date, 1);
calendar.monthStart(date);         // first day of the month, 00:00
calendar.monthEnd(date);           // last day of the month`;
}
