import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ShipIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'sh-datepicker',
  imports: [ShipIconComponent],
  template: `
    <header>
      <button (click)="previousMonth()"><sh-icon>caret-left</sh-icon></button>
      <div class="title">
        {{ getMonthName(currentDate()!) }}
        @if (monthsToShow() > 1) {
          - {{ getMonthName(getLastVisibleMonth()) }}
        }
        {{ getFullYear(currentDate()!) }}
      </div>
      <button (click)="nextMonth()"><sh-icon>caret-right</sh-icon></button>
    </header>

    <section class="months-container">
      @for (monthOffset of monthOffsets(); track monthOffset) {
        <div class="month">
          <nav class="weekdays">
            @for (day of weekdays(); track $index) {
              <div>{{ day }}</div>
            }
          </nav>

          <div class="days" #daysRef>
            @for (calDate of getMonthDates(monthOffset); track $index) {
              <div
                #elementRef
                [class.out-of-scope]="!isCurrentMonth(calDate, monthOffset)"
                [class]="isDateSelected(calDate)"
                (click)="setDate(calDate, elementRef)">
                {{ calDate.getDate() }}
              </div>
            }

            @if (!asRange()) {
              <article class="days">
                <div class="sel-el" [style]="selectedDateStylePosition()"></div>
              </article>
            }
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.as-range]': 'asRange()',
    '[class]': '"columns-" + monthsToShow()',
    '[class.disabled]': 'disabled()',
  },
})
export class ShipDatepickerComponent {
  #INIT_DATE = this.#getUTCDate(new Date());

  date = model<Date | null>(null);
  endDate = model<Date | null>(null);
  asRange = input<boolean>(false);
  monthsToShow = input<number>(1);
  disabled = input<boolean>(false);

  startOfWeek = input<number>(1);
  weekdayLabels = input<string[]>(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);

  daysRef = viewChild<ElementRef<HTMLDivElement>>('daysRef');
  currentDate = signal<Date>(this.date() ?? this.#INIT_DATE);

  monthOffsets = computed(() => {
    return Array.from({ length: this.monthsToShow() }, (_, i) => i);
  });

  selectedDateStylePosition = signal<{ transform: string; opacity: string } | null>(null);

  weekdays = computed(() => {
    const startOfWeek = this.startOfWeek();
    const weekdayLabels = this.weekdayLabels();

    return weekdayLabels.slice(startOfWeek).concat(weekdayLabels.slice(0, startOfWeek));
  });

  getLastVisibleMonth(): Date {
    const lastMonthOffset = this.monthsToShow() - 1;
    return this.getOffsetDate(lastMonthOffset);
  }

  getOffsetDate(monthOffset: number): Date {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }

  getMonthDates(monthOffset: number): Date[] {
    const offsetDate = this.getOffsetDate(monthOffset);
    return this.#generateMonthDates(offsetDate, this.startOfWeek());
  }

  #newDateEffect = effect(() => {
    if (this.monthsToShow() > 1) return;

    this.#setDateAsCurrent();
  });

  ngOnInit() {
    if (this.monthsToShow() === 1) return;

    this.#setDateAsCurrent();
  }

  #setDateAsCurrent() {
    const newDate = this.date();
    if (newDate) this.currentDate.set(newDate);
    this.#findSelectedAndCalc();
  }

  #findSelectedAndCalc() {
    setTimeout(() => {
      const selectedElement = this.daysRef()?.nativeElement.querySelector('.sel');

      if (!selectedElement) {
        return this.selectedDateStylePosition.update((x) => (x ? { ...x, opacity: '0' } : null));
      }

      this.setSelectedDateStylePosition(selectedElement as HTMLDivElement);
    });
  }

  #generateMonthDates(date: Date, startOfWeek: number): Date[] {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month)).getUTCDay();
    const daysInMonth = 32 - new Date(Date.UTC(year, month, 32)).getUTCDate();
    const dates: Date[] = [];

    let offset = firstDay - startOfWeek;
    if (offset < 0) {
      offset += 7;
    }

    const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let i = offset - 1; i >= 0; i--) {
      const prevMonthDate = new Date(Date.UTC(year, month - 1, lastDayOfPrevMonth - i));
      dates.push(prevMonthDate);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(Date.UTC(year, month, i)));
    }

    let nextMonthDay = 1;
    while (dates.length % 7 !== 0) {
      dates.push(new Date(Date.UTC(year, month + 1, nextMonthDay++)));
    }

    return dates;
  }

  nextMonth() {
    this.currentDate.update((currentDate) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      return newDate;
    });

    this.#findSelectedAndCalc();
  }

  previousMonth() {
    this.currentDate.update((currentDate) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      return newDate;
    });

    this.#findSelectedAndCalc();
  }

  setDate(newDate: Date, selectedElement: HTMLDivElement) {
    const createDateWithExistingTime = (newDate: Date, existingDate: Date | null) => {
      const hours = existingDate?.getUTCHours() ?? 0;
      const minutes = existingDate?.getUTCMinutes() ?? 0;
      const seconds = existingDate?.getUTCSeconds() ?? 0;
      const milliseconds = existingDate?.getUTCMilliseconds() ?? 0;

      return this.#getUTCDate(
        new Date(
          Date.UTC(
            newDate.getUTCFullYear(),
            newDate.getUTCMonth(),
            newDate.getUTCDate(),
            hours,
            minutes,
            seconds,
            milliseconds
          )
        )
      );
    };

    if (!this.asRange()) {
      this.date.set(createDateWithExistingTime(newDate, this.date()));
      this.endDate.set(null);
    } else {
      const startDate = this.date();
      const endDate = this.endDate();
      const utcDate = createDateWithExistingTime(newDate, null);

      if (!startDate) {
        this.date.set(utcDate);
      } else if (!endDate) {
        if (utcDate < startDate) {
          this.date.set(utcDate);
          this.endDate.set(null);
        } else {
          this.endDate.set(utcDate);
        }
      } else {
        this.date.set(utcDate);
        this.endDate.set(null);
      }
    }

    if (this.asRange()) return;

    this.setSelectedDateStylePosition(selectedElement);
  }

  isDateSelected(date: Date): string | null {
    const startDate = this.date();
    const endDate = this.endDate();

    if (startDate === null) return null;

    const startOfDay = (date: Date) => {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    };

    const endOfDay = (date: Date) => {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    };

    const currentDate = startOfDay(date);
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endDate ? endOfDay(endDate) : null;

    let classes = [];

    if (this.asRange()) {
      if (rangeEnd === null) {
        if (currentDate.getTime() === rangeStart.getTime()) {
          classes.push('sel first last');
        }
      } else {
        if (currentDate.getTime() === rangeStart.getTime()) {
          classes.push('first');
        }

        if (currentDate.getTime() === startOfDay(rangeEnd).getTime()) {
          classes.push('last');
        }

        if (currentDate >= rangeStart && currentDate <= rangeEnd) {
          classes.push('sel');

          const dayOfWeek = currentDate.getUTCDay();
          const startOfWeek = this.startOfWeek();

          if (dayOfWeek === startOfWeek) {
            classes.push('week-start');
          }

          const endOfWeek = (startOfWeek + 6) % 7;
          if (dayOfWeek === endOfWeek) {
            classes.push('week-end');
          }
        }

        const nextDate = new Date(currentDate);
        nextDate.setUTCDate(currentDate.getUTCDate() + 1);
        const prevDate = new Date(currentDate);
        prevDate.setUTCDate(currentDate.getUTCDate() - 1);

        const isFirstOfMonth = currentDate.getUTCDate() === 1;
        const isLastOfMonth = nextDate.getUTCMonth() !== currentDate.getUTCMonth();

        if (isFirstOfMonth) {
          classes.push('month-start');
        }

        if (isLastOfMonth) {
          classes.push('month-end');
        }
      }
    } else {
      if (currentDate.getTime() === rangeStart.getTime()) {
        classes.push('sel');
      }
    }

    return classes.join(' ') || null;
  }

  setSelectedDateStylePosition(selectedElement: HTMLDivElement) {
    this.selectedDateStylePosition.set({
      transform: `translate(${selectedElement.offsetLeft}px, ${selectedElement.offsetTop}px)`,
      opacity: '1',
    });
  }

  getMonthName(date: Date): string {
    return date.toLocaleString('default', { month: 'long' });
  }

  getFullYear(date: Date): number {
    return date.getFullYear();
  }

  // Rest of the component methods remain the same, but update isCurrentMonth:
  isCurrentMonth(date: Date, monthOffset: number): boolean {
    const offsetDate = this.getOffsetDate(monthOffset);
    return date.getMonth() === offsetDate.getMonth();
  }

  #getUTCDate(date: Date): Date {
    const offsetMinutes = date.getTimezoneOffset();
    const timeDiffMillis = offsetMinutes * 60 * 1000;

    return new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      ) + timeDiffMillis
    );
  }
}
