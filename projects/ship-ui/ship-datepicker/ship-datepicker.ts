import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { classMutationSignal, ShipCalendarService } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { ShipIcon } from '@ship-ui/core/ship-icon';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function toValidDate(value: Date | string | number | null): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

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

@Component({
  selector: 'sh-datepicker',
  styleUrl: './ship-datepicker.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  providers: [ShipCalendarService],
  template: `
    <header>
      <button tabindex="-1" (click)="previousMonth()" [attr.aria-keyshortcuts]="prevMonthShortcut()">
        <sh-icon>caret-left</sh-icon>
      </button>
      <div class="title">
        {{ calendar.getMonthName(calendar.currentDate()) }}
        @if (monthsToShow() > 1) {
          - {{ calendar.getMonthName(calendar.getLastVisibleMonth()) }}
        }
        {{ calendar.getFullYear(calendar.currentDate()) }}
      </div>
      <button tabindex="-1" (click)="nextMonth()" [attr.aria-keyshortcuts]="nextMonthShortcut()">
        <sh-icon>caret-right</sh-icon>
      </button>
    </header>

    <section class="months-container">
      @for (month of calendar.months(); track monthOffset; let monthOffset = $index) {
        <div class="month">
          <nav class="weekdays">
            @for (day of calendar.weekdays(); track $index) {
              <div>{{ day }}</div>
            }
          </nav>

          <div class="days" #daysRef>
            @for (calDate of month.dates; track $index) {
              <button
                type="button"
                [class.out-of-scope]="!calendar.isCurrentMonth(calDate, monthOffset)"
                [class]="isDateSelected(calDate)"
                [attr.aria-label]="calendar.getAriaLabel(calDate)"
                [attr.tabindex]="getTabIndex(calDate)"
                [attr.aria-selected]="isDateSelectedBool(calDate)"
                (keydown)="onKeydown($event, calDate)"
                (click)="onDayClick(calDate)">
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
  #keybindings = inject(ShipA11yKeybindingsService);
  #selfRef = inject(ElementRef);

  calendar = inject(ShipCalendarService);

  #currentClasses = classMutationSignal();

  date = model<Date | null>(null);
  endDate = model<Date | null>(null);
  asRange = input<boolean>(false);
  activeRangeSelection = input<'start' | 'end' | null>(null);
  monthsToShow = input<number>(1);
  disabled = input<boolean>(false);
  startOfWeek = input<number>(1); //(`0` = Sunday, `1` = Monday).
  weekdayLabels = input<string[] | null>(null); // Defaults to locale-derived labels.
  locale = input<string | undefined>(undefined);
  tabbedOut = output<void>();

  daysRef = viewChild<ElementRef<HTMLDivElement>>('daysRef');
  focusedDate = signal<Date | null>(null);
  selectedDateStylePosition = signal<{ transform: string; opacity: string } | null>(null);

  prevMonthShortcut = computed(() => {
    const action = 'datepicker.prev-month';
    const shortcut = this.#keybindings.getShortcut(action);
    return shortcut ? this.#keybindings.getDisplayShortcut(action) || shortcut : null;
  });

  nextMonthShortcut = computed(() => {
    const action = 'datepicker.next-month';
    const shortcut = this.#keybindings.getShortcut(action);
    return shortcut ? this.#keybindings.getDisplayShortcut(action) || shortcut : null;
  });

  #syncConfig = effect(() => {
    this.calendar.monthsToShow.set(this.monthsToShow());
    this.calendar.startOfWeek.set(this.startOfWeek());
    this.calendar.weekdayLabels.set(this.weekdayLabels());
    this.calendar.locale.set(this.locale());
  });

  #syncCurrentFromDate = effect(() => {
    const d = this.date();
    if (this.monthsToShow() > 1) return;
    if (d && !isNaN(d.getTime())) this.calendar.currentDate.set(d);
  });

  #selIndicator = afterRenderEffect(() => {
    this.date();
    this.calendar.months();
    this.#currentClasses();
    if (this.asRange()) return;

    const selectedElement = this.daysRef()?.nativeElement.querySelector('.sel');
    if (!selectedElement) {
      this.selectedDateStylePosition.update((x) => (x ? { ...x, opacity: '0' } : null));
      return;
    }
    this.setSelectedDateStylePosition(selectedElement as HTMLElement);
  });

  @HostListener('focusout', ['$event'])
  onFocusOut(_event: FocusEvent) {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement !== document.body && !this.#selfRef.nativeElement.contains(activeElement)) {
        this.tabbedOut.emit();
      }
    });
  }

  ngOnInit() {
    if (this.monthsToShow() === 1) return;
    const d = this.date();
    if (d && !isNaN(d.getTime())) this.calendar.currentDate.set(d);
  }

  nextMonth() {
    this.calendar.nextMonth();
  }

  previousMonth() {
    this.calendar.previousMonth();
  }

  onDayClick(calDate: Date) {
    this.focusedDate.set(calDate);
    this.selectDate(calDate);
  }

  selectDate(newDate: Date): void {
    if (!this.asRange()) {
      this.date.set(withExistingTime(newDate, this.date()));
      this.endDate.set(null);
      return;
    }

    const startDate = this.date();
    const endDate = this.endDate();
    const mode = this.activeRangeSelection();

    if (mode === 'start') {
      const next = withExistingTime(newDate, startDate);
      this.date.set(next);
      if (endDate && next > endDate) this.endDate.set(null);
    } else if (mode === 'end') {
      if (!startDate || newDate < startDate) {
        this.date.set(withExistingTime(newDate, startDate));
        this.endDate.set(null);
      } else {
        this.endDate.set(withExistingTime(newDate, endDate));
      }
    } else {
      if (!startDate) {
        this.date.set(withExistingTime(newDate, startDate));
      } else if (!endDate) {
        if (newDate < startDate) {
          this.date.set(withExistingTime(newDate, startDate));
          this.endDate.set(null);
        } else {
          this.endDate.set(withExistingTime(newDate, endDate));
        }
      } else {
        this.date.set(withExistingTime(newDate, startDate));
        this.endDate.set(null);
      }
    }
  }

  #selection = computed(() => {
    const start = toValidDate(this.date());
    if (!start) return null;
    const end = toValidDate(this.endDate());
    return { start: startOfDay(start).getTime(), end: end ? startOfDay(end).getTime() : null };
  });

  isDateSelectedBool(date: Date): boolean {
    const sel = this.#selection();
    if (!sel) return false;
    const day = startOfDay(date).getTime();
    if (!this.asRange() || sel.end === null) return day === sel.start;
    return day >= sel.start && day <= sel.end;
  }

  isDateSelected(date: Date): string | null {
    const sel = this.#selection();
    if (!sel) return null;
    const day = startOfDay(date).getTime();

    if (!this.asRange()) return day === sel.start ? 'sel' : null;
    if (sel.end === null) return day === sel.start ? 'sel first last' : null;

    const classes: string[] = [];

    if (day === sel.start) classes.push('first');
    if (day === sel.end) classes.push('last');

    if (day >= sel.start && day <= sel.end) {
      classes.push('sel');

      const dayOfWeek = date.getDay();
      const startOfWeek = this.startOfWeek();
      if (dayOfWeek === startOfWeek) classes.push('week-start');
      if (dayOfWeek === (startOfWeek + 6) % 7) classes.push('week-end');
    }

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    if (date.getDate() === 1) classes.push('month-start');
    if (nextDate.getMonth() !== date.getMonth()) classes.push('month-end');

    return classes.join(' ') || null;
  }

  getTabIndex(date: Date): number {
    const focused = this.focusedDate();
    const selected = this.date();
    const today = new Date();

    if (focused) return this.calendar.isSameDay(date, focused) ? 0 : -1;
    if (selected) return this.calendar.isSameDay(date, selected) ? 0 : -1;
    return this.calendar.isSameDay(date, today) ? 0 : -1;
  }

  onKeydown(event: KeyboardEvent, date: Date) {
    let newDate = new Date(date);
    let handled = false;

    if (this.#keybindings.matches(event, 'datepicker.prev-month')) {
      newDate = this.calendar.addMonths(date, -1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.next-month')) {
      newDate = this.calendar.addMonths(date, 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.prev-year')) {
      newDate = this.calendar.addYears(date, -1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.next-year')) {
      newDate = this.calendar.addYears(date, 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.month-start')) {
      newDate = this.calendar.monthStart(date);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.month-end')) {
      newDate = this.calendar.monthEnd(date);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.day-next')) {
      newDate = this.calendar.addDays(date, 1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.day-prev')) {
      newDate = this.calendar.addDays(date, -1);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.week-next')) {
      newDate = this.calendar.addDays(date, 7);
      handled = true;
    } else if (this.#keybindings.matches(event, 'datepicker.week-prev')) {
      newDate = this.calendar.addDays(date, -7);
      handled = true;
    }

    if (!handled) return;

    event.preventDefault();
    this.calendar.ensureDateVisible(newDate);
    this.focusedDate.set(newDate);

    setTimeout(() => {
      const buttons = this.#selfRef.nativeElement.querySelectorAll('button');
      if (!buttons) return;
      const targetAria = this.calendar.getAriaLabel(newDate);
      let bestMatch: HTMLButtonElement | null = null;
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute('aria-label') === targetAria) {
          bestMatch = buttons[i];
          if (!buttons[i].classList.contains('out-of-scope')) break;
        }
      }
      bestMatch?.focus();
    });
  }

  focusActiveDate() {
    setTimeout(() => {
      const activeBtn = this.#selfRef.nativeElement.querySelector('button[tabindex="0"]') as HTMLButtonElement;
      if (activeBtn) activeBtn.focus();
    }, 50);
  }

  setSelectedDateStylePosition(selectedElement: HTMLElement) {
    this.selectedDateStylePosition.set({
      transform: `translate(${selectedElement.offsetLeft}px, ${selectedElement.offsetTop}px)`,
      opacity: '1',
    });
  }
}
