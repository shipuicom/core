import { computed, Injectable, signal } from '@angular/core';

/** A single visible month in the grid: its anchor date plus the full padded day cells. */
export interface ShipCalendarMonth {
  date: Date;
  dates: Date[];
}

/**
 * Framework-agnostic calendar engine.
 *
 * Holds all the pure calendar logic — month-grid generation, month/day navigation,
 * single- and range-selection date math, and `Intl`-based i18n — as signals with zero
 * DOM or keybinding concerns. It can be provided via DI (`providers: [ShipCalendar]`)
 * so a component gets its own instance, or simply `new ShipCalendar()`d inside a plain
 * calendar-app UI. `ShipDatepicker` consumes it for its view layer.
 *
 * Every cell is built with `new Date(y, m, d, 0, 0, 0, 0)` (local midnight), which keeps
 * grid generation and navigation correct across DST transitions in any timezone.
 */
@Injectable()
export class ShipCalendar {
  /** Anchor date; the grid renders this month (and the following `monthsToShow - 1`). */
  currentDate = signal<Date>(startOfToday());
  /** Selected date; the range start when `asRange` is enabled. */
  selectedDate = signal<Date | null>(null);
  /** Range end date when `asRange` is enabled. */
  endDate = signal<Date | null>(null);
  /** When `true`, `selectDate` builds a range instead of a single date. */
  asRange = signal<boolean>(false);
  /** Which end of the range is currently being edited. */
  activeRangeSelection = signal<'start' | 'end' | null>(null);
  /** Number of consecutive month grids to expose via `months()`. */
  monthsToShow = signal<number>(1);
  /** Index of the first weekday column (`0` = Sunday, `1` = Monday). */
  startOfWeek = signal<number>(1);
  /** Explicit Sunday-first weekday header labels; `null` derives them from `locale`. */
  weekdayLabels = signal<string[] | null>(null);
  /** BCP-47 locale for all `Intl` formatting; `undefined` uses the runtime default. */
  locale = signal<string | undefined>(undefined);

  /** `[0 .. monthsToShow - 1]`. */
  monthOffsets = computed(() => Array.from({ length: this.monthsToShow() }, (_, i) => i));

  /** Ready-to-render model: one padded grid per visible month. */
  months = computed<ShipCalendarMonth[]>(() =>
    this.monthOffsets().map((offset) => {
      const date = this.getOffsetDate(offset);
      return { date, dates: this.#generateMonthDates(date, this.startOfWeek()) };
    })
  );

  /** Localized, Sunday-first short weekday labels (independent of `startOfWeek`). */
  intlWeekdays = computed<string[]>(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    // 2023-01-01 is a Sunday — walk one full week from it.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)));
  });

  /** Effective header labels: the `weekdayLabels` override or `intlWeekdays`, rotated to `startOfWeek`. */
  weekdays = computed<string[]>(() => {
    const base = this.weekdayLabels() ?? this.intlWeekdays();
    const start = this.startOfWeek();
    return base.slice(start).concat(base.slice(0, start));
  });

  /** Returns `currentDate` advanced by `monthOffset` months. */
  getOffsetDate(monthOffset: number): Date {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }

  /** Returns the date of the last month currently visible in the grid. */
  getLastVisibleMonth(): Date {
    return this.getOffsetDate(this.monthsToShow() - 1);
  }

  /** Returns the full calendar-grid dates for the month at `monthOffset`, including padding days. */
  getMonthDates(monthOffset: number): Date[] {
    return this.#generateMonthDates(this.getOffsetDate(monthOffset), this.startOfWeek());
  }

  #generateMonthDates(date: Date, startOfWeek: number): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: Date[] = [];

    let offset = firstDay - startOfWeek;
    if (offset < 0) offset += 7;

    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    for (let i = offset - 1; i >= 0; i--) {
      dates.push(new Date(year, month - 1, lastDayOfPrevMonth - i, 0, 0, 0, 0));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i, 0, 0, 0, 0));
    }

    let nextMonthDay = 1;
    while (dates.length % 7 !== 0) {
      dates.push(new Date(year, month + 1, nextMonthDay++, 0, 0, 0, 0));
    }

    return dates;
  }

  /** Advances the anchor to the next month. */
  nextMonth(): void {
    this.currentDate.update((current) => this.addMonths(current, 1));
  }

  /** Rewinds the anchor to the previous month. */
  previousMonth(): void {
    this.currentDate.update((current) => this.addMonths(current, -1));
  }

  /** Sets the anchor to the first day of `date`'s month. */
  goToMonth(date: Date): void {
    this.currentDate.set(this.monthStart(date));
  }

  /** Shifts the visible window so that `date` falls within the displayed range. */
  ensureDateVisible(date: Date): void {
    const start = this.currentDate();
    const end = this.getLastVisibleMonth();

    if (date < new Date(start.getFullYear(), start.getMonth(), 1)) {
      this.currentDate.set(new Date(date.getFullYear(), date.getMonth(), 1));
    } else if (date > new Date(end.getFullYear(), end.getMonth() + 1, 0)) {
      const newStart = new Date(date);
      newStart.setMonth(newStart.getMonth() - this.monthsToShow() + 1);
      newStart.setDate(1);
      this.currentDate.set(newStart);
    }
  }

  /**
   * Applies a click/keyboard pick to the selection, honoring single vs range mode and
   * the active range end. Time-of-day is carried over from the previous value on that end.
   */
  selectDate(newDate: Date): void {
    if (!this.asRange()) {
      this.selectedDate.set(withExistingTime(newDate, this.selectedDate()));
      this.endDate.set(null);
      return;
    }

    const startDate = this.selectedDate();
    const endDate = this.endDate();
    const mode = this.activeRangeSelection();

    if (mode === 'start') {
      const next = withExistingTime(newDate, startDate);
      this.selectedDate.set(next);
      if (endDate && next > endDate) this.endDate.set(null);
    } else if (mode === 'end') {
      if (!startDate || newDate < startDate) {
        this.selectedDate.set(withExistingTime(newDate, startDate));
        this.endDate.set(null);
      } else {
        this.endDate.set(withExistingTime(newDate, endDate));
      }
    } else {
      if (!startDate) {
        this.selectedDate.set(withExistingTime(newDate, startDate));
      } else if (!endDate) {
        if (newDate < startDate) {
          this.selectedDate.set(withExistingTime(newDate, startDate));
          this.endDate.set(null);
        } else {
          this.endDate.set(withExistingTime(newDate, endDate));
        }
      } else {
        this.selectedDate.set(withExistingTime(newDate, startDate));
        this.endDate.set(null);
      }
    }
  }

  /** Returns the space-separated CSS selection classes for `date`, or `null` if unselected. */
  isDateSelected(date: Date): string | null {
    let startDate: unknown = this.selectedDate();
    let endDate: unknown = this.endDate();

    if (typeof startDate === 'string' || typeof startDate === 'number') startDate = new Date(startDate);
    if (typeof endDate === 'string' || typeof endDate === 'number') endDate = new Date(endDate);

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) return null;

    const currentDate = startOfDay(date);
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endDate instanceof Date && !isNaN(endDate.getTime()) ? endOfDay(endDate) : null;

    const classes: string[] = [];

    if (!this.asRange()) {
      if (currentDate.getTime() === rangeStart.getTime()) classes.push('sel');
      return classes.join(' ') || null;
    }

    if (rangeEnd === null) {
      if (currentDate.getTime() === rangeStart.getTime()) classes.push('sel first last');
      return classes.join(' ') || null;
    }

    if (currentDate.getTime() === rangeStart.getTime()) classes.push('first');
    if (currentDate.getTime() === startOfDay(rangeEnd).getTime()) classes.push('last');

    if (currentDate >= rangeStart && currentDate <= rangeEnd) {
      classes.push('sel');

      const dayOfWeek = currentDate.getDay();
      const startOfWeek = this.startOfWeek();
      if (dayOfWeek === startOfWeek) classes.push('week-start');
      if (dayOfWeek === (startOfWeek + 6) % 7) classes.push('week-end');
    }

    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    if (currentDate.getDate() === 1) classes.push('month-start');
    if (nextDate.getMonth() !== currentDate.getMonth()) classes.push('month-end');

    return classes.join(' ') || null;
  }

  /** Whether `date` is part of the current selection. */
  isDateSelectedBool(date: Date): boolean {
    const classes = this.isDateSelected(date);
    return classes ? classes.includes('sel') : false;
  }

  /** Whether `date` belongs to the month shown at `monthOffset` (vs. a padding day). */
  isCurrentMonth(date: Date, monthOffset: number): boolean {
    return date.getMonth() === this.getOffsetDate(monthOffset).getMonth();
  }

  /** Whether two dates fall on the same calendar day. */
  isSameDay(d1: Date | null | undefined, d2: Date | null | undefined): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  /** Localized full month name for `date`. */
  getMonthName(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'long' }).format(date);
  }

  /** Four-digit year of `date`. */
  getFullYear(date: Date): number {
    return date.getFullYear();
  }

  /** Localized accessible label for `date`'s day cell. */
  getAriaLabel(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  // --- pure date-math helpers (DST-safe: calendar-based, not millisecond-based) ---

  /** `date` shifted by `n` calendar days. */
  addDays(date: Date, n: number): Date {
    const next = new Date(date);
    next.setDate(date.getDate() + n);
    return next;
  }

  /** `date` shifted by `n` months (JS overflow semantics). */
  addMonths(date: Date, n: number): Date {
    const next = new Date(date);
    next.setMonth(date.getMonth() + n);
    return next;
  }

  /** `date` shifted by `n` years. */
  addYears(date: Date, n: number): Date {
    const next = new Date(date);
    next.setFullYear(date.getFullYear() + n);
    return next;
  }

  /** First day of `date`'s month at local midnight. */
  monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  /** Last day of `date`'s month at local midnight. */
  monthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
  }
}

function startOfToday(): Date {
  return new Date(new Date().setHours(0, 0, 0, 0));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Builds a date on `newDate`'s day carrying the time-of-day from `existing` (if any). */
function withExistingTime(newDate: Date, existing: Date | string | number | null): Date {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;

  if (existing != null) {
    const ref = existing instanceof Date ? existing : new Date(existing);
    if (!isNaN(ref.getTime())) {
      hours = ref.getHours();
      minutes = ref.getMinutes();
      seconds = ref.getSeconds();
      milliseconds = ref.getMilliseconds();
    }
  }

  return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hours, minutes, seconds, milliseconds);
}
