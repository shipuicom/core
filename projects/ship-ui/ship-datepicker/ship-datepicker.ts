import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, model, output, signal, viewChild, inject, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { classMutationSignal } from '@ship-ui/core';
import { HostListener } from '@angular/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';

@Component({
  selector: 'sh-datepicker',
  styleUrl: './ship-datepicker.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    <header>
      <button tabindex="-1" (click)="previousMonth()" [attr.aria-keyshortcuts]="prevMonthShortcut()"><sh-icon>caret-left</sh-icon></button>
      <div class="title">
        {{ getMonthName(currentDate()!) }}
        @if (monthsToShow() > 1) {
          - {{ getMonthName(getLastVisibleMonth()) }}
        }
        {{ getFullYear(currentDate()!) }}
      </div>
      <button tabindex="-1" (click)="nextMonth()" [attr.aria-keyshortcuts]="nextMonthShortcut()"><sh-icon>caret-right</sh-icon></button>
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
              <button
                type="button"
                #elementRef
                [class.out-of-scope]="!isCurrentMonth(calDate, monthOffset)"
                [class]="isDateSelected(calDate)"
                [attr.aria-label]="getAriaLabel(calDate)"
                [attr.tabindex]="getTabIndex(calDate)"
                [attr.aria-selected]="isDateSelectedBool(calDate)"
                (keydown)="onKeydown($event, calDate)"
                (click)="setDate(calDate, elementRef)">
                {{ calDate.getDate() }}
              </button>
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
export class ShipDatepicker {
  #INIT_DATE = new Date(new Date().setHours(0, 0, 0, 0));

  /** Selected date; the range start date when `asRange` is enabled. Two-way bindable. */
  date = model<Date | null>(null);
  /** Selected range end date when `asRange` is enabled. Two-way bindable. */
  endDate = model<Date | null>(null);
  /** When `true`, selects a date range instead of a single date. */
  asRange = input<boolean>(false);
  /** Which end of the range is currently being edited: `'start'`, `'end'`, or `null`. */
  activeRangeSelection = input<'start' | 'end' | null>(null);
  /** Number of consecutive month grids to display side by side. */
  monthsToShow = input<number>(1);
  /** Disables date selection. */
  disabled = input<boolean>(false);
  /** Emits when keyboard focus leaves the datepicker (e.g. tabbing out). */
  tabbedOut = output<void>();

  /** Index of the first weekday column (`0` = Sunday, `1` = Monday). */
  startOfWeek = input<number>(1);
  /** Weekday column labels, ordered Sunday through Saturday. */
  weekdayLabels = input<string[]>(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);

  daysRef = viewChild<ElementRef<HTMLDivElement>>('daysRef');
  currentDate = signal<Date>(this.date() ?? this.#INIT_DATE);

  #keybindings = inject(ShipA11yKeybindingsService);

  prevMonthShortcut = computed(() => {
    const action = 'datepicker.prev-month';
    const shortcut = this.#keybindings.getShortcut(action);
    return shortcut ? (this.#keybindings.getDisplayShortcut(action) || shortcut) : null;
  });

  nextMonthShortcut = computed(() => {
    const action = 'datepicker.next-month';
    const shortcut = this.#keybindings.getShortcut(action);
    return shortcut ? (this.#keybindings.getDisplayShortcut(action) || shortcut) : null;
  });

  monthOffsets = computed(() => {
    return Array.from({ length: this.monthsToShow() }, (_, i) => i);
  });

  selectedDateStylePosition = signal<{ transform: string; opacity: string } | null>(null);

  weekdays = computed(() => {
    const startOfWeek = this.startOfWeek();
    const weekdayLabels = this.weekdayLabels();

    return weekdayLabels.slice(startOfWeek).concat(weekdayLabels.slice(0, startOfWeek));
  });

  currentClasses = classMutationSignal();
  someEffect = effect(() => {
    const _ = this.currentClasses();

    this.#findSelectedAndCalc();
  });

  /** Returns the date of the last month currently visible in the grid. */
  getLastVisibleMonth(): Date {
    const lastMonthOffset = this.monthsToShow() - 1;
    return this.getOffsetDate(lastMonthOffset);
  }

  /** Returns `currentDate` advanced by `monthOffset` months. */
  getOffsetDate(monthOffset: number): Date {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }

  /** Returns the full calendar-grid dates for the month at `monthOffset`, including padding days. */
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
    if (newDate && !isNaN(newDate.getTime())) {
      this.currentDate.set(newDate);
    }
    this.#findSelectedAndCalc();
  }

  #findSelectedAndCalc() {
    setTimeout(() => {
      const selectedElement = this.daysRef()?.nativeElement.querySelector('.sel');

      if (!selectedElement) {
        return this.selectedDateStylePosition.update((x) => (x ? { ...x, opacity: '0' } : null));
      }

      this.setSelectedDateStylePosition(selectedElement as HTMLElement);
    });
  }

  #generateMonthDates(date: Date, startOfWeek: number): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: Date[] = [];

    let offset = firstDay - startOfWeek;
    if (offset < 0) {
      offset += 7;
    }

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

  setDate(newDate: Date, selectedElement: HTMLElement) {
    this.focusedDate.set(newDate);

    const createDateWithExistingTime = (newDate: Date, existingDate: any | null) => {
      let hours = 0, minutes = 0, seconds = 0, milliseconds = 0;
      
      if (existingDate) {
        if (typeof existingDate === 'string' || typeof existingDate === 'number') {
          existingDate = new Date(existingDate);
        }
        if (existingDate instanceof Date && !isNaN(existingDate.getTime())) {
          hours = existingDate.getHours();
          minutes = existingDate.getMinutes();
          seconds = existingDate.getSeconds();
          milliseconds = existingDate.getMilliseconds();
        }
      }

      return new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        hours,
        minutes,
        seconds,
        milliseconds
      );
    };

    if (!this.asRange()) {
      this.date.set(createDateWithExistingTime(newDate, this.date()));
      this.endDate.set(null);
    } else {
      const startDate = this.date();
      const endDate = this.endDate();
      const selectionMode = this.activeRangeSelection();

      if (selectionMode === 'start') {
        const utcDate = createDateWithExistingTime(newDate, startDate);
        this.date.set(utcDate);
        if (endDate && utcDate > endDate) {
          this.endDate.set(null);
        }
      } else if (selectionMode === 'end') {
        if (!startDate || newDate < startDate) {
          const newStart = createDateWithExistingTime(newDate, startDate);
          this.date.set(newStart);
          this.endDate.set(null);
        } else {
          const utcDate = createDateWithExistingTime(newDate, endDate);
          this.endDate.set(utcDate);
        }
      } else {
        if (!startDate) {
          const utcDate = createDateWithExistingTime(newDate, startDate);
          this.date.set(utcDate);
        } else if (!endDate) {
          if (newDate < startDate) {
            const newStart = createDateWithExistingTime(newDate, startDate);
            this.date.set(newStart);
            this.endDate.set(null);
          } else {
            const utcDate = createDateWithExistingTime(newDate, endDate);
            this.endDate.set(utcDate);
          }
        } else {
          const utcDate = createDateWithExistingTime(newDate, startDate);
          this.date.set(utcDate);
          this.endDate.set(null);
        }
      }
    }

    if (this.asRange()) return;

    this.setSelectedDateStylePosition(selectedElement);
  }

  /** Returns the space-separated CSS selection classes for `date`, or `null` if unselected. */
  isDateSelected(date: Date): string | null {
    let startDate: any = this.date();
    let endDate: any = this.endDate();

    if (typeof startDate === 'string' || typeof startDate === 'number') startDate = new Date(startDate);
    if (typeof endDate === 'string' || typeof endDate === 'number') endDate = new Date(endDate);

    if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) return null;

    const startOfDay = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    };

    const endOfDay = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
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

          const dayOfWeek = currentDate.getDay();
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
        nextDate.setDate(currentDate.getDate() + 1);
        const prevDate = new Date(currentDate);
        prevDate.setDate(currentDate.getDate() - 1);

        const isFirstOfMonth = currentDate.getDate() === 1;
        const isLastOfMonth = nextDate.getMonth() !== currentDate.getMonth();

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

  /** Moves the sliding selection highlight to cover the given day element. */
  setSelectedDateStylePosition(selectedElement: HTMLElement) {
    this.selectedDateStylePosition.set({
      transform: `translate(${selectedElement.offsetLeft}px, ${selectedElement.offsetTop}px)`,
      opacity: '1',
    });
  }

  /** Returns the localized full month name for `date`. */
  getMonthName(date: Date): string {
    return date.toLocaleString('default', { month: 'long' });
  }

  /** Returns the four-digit year of `date`. */
  getFullYear(date: Date): number {
    return date.getFullYear();
  }

  // Rest of the component methods remain the same, but update isCurrentMonth:
  /** Whether `date` belongs to the month shown at `monthOffset` (vs. a padding day). */
  isCurrentMonth(date: Date, monthOffset: number): boolean {
    const offsetDate = this.getOffsetDate(monthOffset);
    return date.getMonth() === offsetDate.getMonth();
  }

  focusedDate = signal<Date | null>(null);
  #selfRef = inject(ElementRef);

  /** Whether two dates fall on the same calendar day. */
  isSameDay(d1: Date | null | undefined, d2: Date | null | undefined): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /** Returns the localized accessible label for `date`'s day button. */
  getAriaLabel(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  /** Returns the roving tabindex (`0` or `-1`) for `date`'s day button. */
  getTabIndex(date: Date): number {
    const focused = this.focusedDate();
    const selected = this.date();
    const today = new Date();

    if (focused) {
      return this.isSameDay(date, focused) ? 0 : -1;
    }
    if (selected) {
      return this.isSameDay(date, selected) ? 0 : -1;
    }
    return this.isSameDay(date, today) ? 0 : -1;
  }

  /** Whether `date` is part of the current selection. */
  isDateSelectedBool(date: Date): boolean {
    const classes = this.isDateSelected(date);
    return classes ? classes.includes('sel') : false;
  }

  onKeydown(event: KeyboardEvent, date: Date) {
    let newDate = new Date(date);
    let handled = false;

    if (this.#keybindings.matches(event, 'datepicker.prev-month')) {
      newDate.setMonth(date.getMonth() - 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.next-month')) {
      newDate.setMonth(date.getMonth() + 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.prev-year')) {
      newDate.setFullYear(date.getFullYear() - 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.next-year')) {
      newDate.setFullYear(date.getFullYear() + 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.month-start')) {
      newDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.month-end')) {
      newDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.day-next')) {
      newDate.setDate(date.getDate() + 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.day-prev')) {
      newDate.setDate(date.getDate() - 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.week-next')) {
      newDate.setDate(date.getDate() + 7);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.week-prev')) {
      newDate.setDate(date.getDate() - 7);
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      this.ensureDateVisible(newDate);
      this.focusedDate.set(newDate);
      
      setTimeout(() => {
        const buttons = this.#selfRef.nativeElement.querySelectorAll('button');
        if (buttons) {
          const targetAria = this.getAriaLabel(newDate);
          let bestMatch: HTMLButtonElement | null = null;
          for (let i = 0; i < buttons.length; i++) {
             if (buttons[i].getAttribute('aria-label') === targetAria) {
               bestMatch = buttons[i];
               if (!buttons[i].classList.contains('out-of-scope')) {
                 break;
               }
             }
          }
          if (bestMatch) {
            bestMatch.focus();
          }
        }
      });
    }
  }

  /** Shifts the visible months so that `date` is within the displayed range. */
  ensureDateVisible(date: Date) {
    const start = this.currentDate();
    const end = this.getLastVisibleMonth();
    
    if (date < new Date(start.getFullYear(), start.getMonth(), 1)) {
      this.currentDate.set(new Date(date.getFullYear(), date.getMonth(), 1));
      this.#findSelectedAndCalc();
    } else if (date > new Date(end.getFullYear(), end.getMonth() + 1, 0)) {
      const newStart = new Date(date);
      newStart.setMonth(newStart.getMonth() - this.monthsToShow() + 1);
      newStart.setDate(1);
      this.currentDate.set(newStart);
      this.#findSelectedAndCalc();
    }
  }

  /** Moves DOM focus to the currently active (tabbable) day button. */
  focusActiveDate() {
    setTimeout(() => {
      const activeBtn = this.#selfRef.nativeElement.querySelector('button[tabindex="0"]') as HTMLButtonElement;
      if (activeBtn) activeBtn.focus();
    }, 50);
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement &&
        activeElement !== document.body &&
        !this.#selfRef.nativeElement.contains(activeElement)
      ) {
        this.tabbedOut.emit();
      }
    });
  }
}
