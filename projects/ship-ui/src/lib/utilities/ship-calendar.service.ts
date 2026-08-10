import { computed, Injectable, signal } from '@angular/core';

export interface ShipCalendarMonth {
  date: Date;
  dates: Date[];
}

@Injectable()
export class ShipCalendarService {
  currentDate = signal<Date>(startOfToday());
  monthsToShow = signal<number>(1);
  startOfWeek = signal<number>(1);
  weekdayLabels = signal<string[] | null>(null);
  locale = signal<string | undefined>(undefined);

  monthOffsets = computed(() => Array.from({ length: this.monthsToShow() }, (_, i) => i));

  months = computed<ShipCalendarMonth[]>(() =>
    this.monthOffsets().map((offset) => {
      const date = this.getOffsetDate(offset);
      return { date, dates: this.#generateMonthDates(date, this.startOfWeek()) };
    })
  );

  intlWeekdays = computed<string[]>(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)).slice(0, 2));
  });

  weekdays = computed<string[]>(() => {
    const base = this.weekdayLabels() ?? this.intlWeekdays();
    const start = this.startOfWeek();
    return base.slice(start).concat(base.slice(0, start));
  });

  getOffsetDate(monthOffset: number): Date {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }

  getLastVisibleMonth(): Date {
    return this.getOffsetDate(this.monthsToShow() - 1);
  }

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

  nextMonth(): void {
    this.currentDate.update((current) => this.addMonths(current, 1));
  }

  previousMonth(): void {
    this.currentDate.update((current) => this.addMonths(current, -1));
  }

  goToMonth(date: Date): void {
    this.currentDate.set(this.monthStart(date));
  }

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

  isCurrentMonth(date: Date, monthOffset: number): boolean {
    return date.getMonth() === this.getOffsetDate(monthOffset).getMonth();
  }

  isSameDay(d1: Date | null | undefined, d2: Date | null | undefined): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  getMonthName(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'long' }).format(date);
  }

  getFullYear(date: Date): number {
    return date.getFullYear();
  }

  getAriaLabel(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  addDays(date: Date, n: number): Date {
    const next = new Date(date);
    next.setDate(date.getDate() + n);
    return next;
  }

  addMonths(date: Date, n: number): Date {
    const next = new Date(date);
    next.setMonth(date.getMonth() + n);
    return next;
  }

  addYears(date: Date, n: number): Date {
    const next = new Date(date);
    next.setFullYear(date.getFullYear() + n);
    return next;
  }

  monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  monthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
  }
}

function startOfToday(): Date {
  return new Date(new Date().setHours(0, 0, 0, 0));
}
