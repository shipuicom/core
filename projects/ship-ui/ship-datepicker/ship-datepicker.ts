import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, HostListener, inject, Injector, input, model, output, signal, untracked, viewChild, ViewEncapsulation } from '@angular/core';
import { classMutationSignal, ShipCalendar } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { ShipIcon } from '@ship-ui/core/ship-icon';

/** Same-instant comparison that treats two nulls as equal. */
function sameInstant(a: Date | null, b: Date | null): boolean {
  return (a ? a.getTime() : null) === (b ? b.getTime() : null);
}

@Component({
  selector: 'sh-datepicker',
  styleUrl: './ship-datepicker.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  // The pure calendar engine is provided per-instance; this component is purely its view layer.
  providers: [ShipCalendar],
  template: `
    <header>
      <button tabindex="-1" (click)="previousMonth()" [attr.aria-keyshortcuts]="prevMonthShortcut()"><sh-icon>caret-left</sh-icon></button>
      <div class="title">
        {{ calendar.getMonthName(calendar.currentDate()) }}
        @if (monthsToShow() > 1) {
          - {{ calendar.getMonthName(calendar.getLastVisibleMonth()) }}
        }
        {{ calendar.getFullYear(calendar.currentDate()) }}
      </div>
      <button tabindex="-1" (click)="nextMonth()" [attr.aria-keyshortcuts]="nextMonthShortcut()"><sh-icon>caret-right</sh-icon></button>
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
                #elementRef
                [class.out-of-scope]="!calendar.isCurrentMonth(calDate, monthOffset)"
                [class]="calendar.isDateSelected(calDate)"
                [attr.aria-label]="calendar.getAriaLabel(calDate)"
                [attr.tabindex]="getTabIndex(calDate)"
                [attr.aria-selected]="calendar.isDateSelectedBool(calDate)"
                (keydown)="onKeydown($event, calDate)"
                (click)="onDayClick(calDate, elementRef)">
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
  /** The pure calendar engine backing this view. Also reachable from a host component if needed. */
  calendar = inject(ShipCalendar);

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
  /** Weekday column labels, ordered Sunday through Saturday. Defaults to locale-derived labels. */
  weekdayLabels = input<string[] | null>(null);
  /** BCP-47 locale for month names, weekday headers and aria labels. Defaults to the runtime locale. */
  locale = input<string | undefined>(undefined);

  daysRef = viewChild<ElementRef<HTMLDivElement>>('daysRef');
  focusedDate = signal<Date | null>(null);
  selectedDateStylePosition = signal<{ transform: string; opacity: string } | null>(null);

  #keybindings = inject(ShipA11yKeybindingsService);
  #selfRef = inject(ElementRef);
  #injector = inject(Injector);

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

  // --- bridge the public input()/model() API into the calendar engine ---

  #syncConfig = effect(() => {
    this.calendar.asRange.set(this.asRange());
    this.calendar.monthsToShow.set(this.monthsToShow());
    this.calendar.startOfWeek.set(this.startOfWeek());
    this.calendar.weekdayLabels.set(this.weekdayLabels());
    this.calendar.activeRangeSelection.set(this.activeRangeSelection());
    this.calendar.locale.set(this.locale());
  });

  // Push external date/endDate changes into the engine (guarded to avoid a sync loop).
  #pushModelToService = effect(() => {
    const d = this.date();
    const e = this.endDate();
    untracked(() => {
      if (!sameInstant(d, this.calendar.selectedDate())) this.calendar.selectedDate.set(d);
      if (!sameInstant(e, this.calendar.endDate())) this.calendar.endDate.set(e);
    });
  });

  // Push engine selection back out to the two-way models (guarded to avoid a sync loop).
  #pullSelectionToModel = effect(() => {
    const sel = this.calendar.selectedDate();
    const end = this.calendar.endDate();
    untracked(() => {
      if (!sameInstant(sel, this.date())) this.date.set(sel);
      if (!sameInstant(end, this.endDate())) this.endDate.set(end);
    });
  });

  // Keep the visible month anchored to the selected date in single-month mode.
  #syncCurrentFromDate = effect(() => {
    const d = this.date();
    if (this.monthsToShow() > 1) return;
    if (d && !isNaN(d.getTime())) this.calendar.currentDate.set(d);
    this.#findSelectedAndCalc();
  });

  #currentClasses = classMutationSignal();
  #recalcOnClassChange = effect(() => {
    this.#currentClasses();
    this.#findSelectedAndCalc();
  });

  ngOnInit() {
    if (this.monthsToShow() === 1) return;
    const d = this.date();
    if (d && !isNaN(d.getTime())) this.calendar.currentDate.set(d);
    this.#findSelectedAndCalc();
  }

  nextMonth() {
    this.calendar.nextMonth();
    this.#findSelectedAndCalc();
  }

  previousMonth() {
    this.calendar.previousMonth();
    this.#findSelectedAndCalc();
  }

  onDayClick(calDate: Date, selectedElement: HTMLElement) {
    this.focusedDate.set(calDate);
    this.calendar.selectDate(calDate);

    if (this.asRange()) return;
    this.setSelectedDateStylePosition(selectedElement);
  }

  /** Returns the roving tabindex (`0` or `-1`) for `date`'s day button. */
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

  /** Moves DOM focus to the currently active (tabbable) day button. */
  focusActiveDate() {
    setTimeout(() => {
      const activeBtn = this.#selfRef.nativeElement.querySelector('button[tabindex="0"]') as HTMLButtonElement;
      if (activeBtn) activeBtn.focus();
    }, 50);
  }

  /** Moves the sliding selection highlight to cover the given day element. */
  setSelectedDateStylePosition(selectedElement: HTMLElement) {
    this.selectedDateStylePosition.set({
      transform: `translate(${selectedElement.offsetLeft}px, ${selectedElement.offsetTop}px)`,
      opacity: '1',
    });
  }

  #findSelectedAndCalc() {
    afterNextRender(
      () => {
        const selectedElement = this.daysRef()?.nativeElement.querySelector('.sel');
        if (!selectedElement) {
          this.selectedDateStylePosition.update((x) => (x ? { ...x, opacity: '0' } : null));
          return;
        }
        this.setSelectedDateStylePosition(selectedElement as HTMLElement);
      },
      { injector: this.#injector }
    );
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(_event: FocusEvent) {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement !== document.body && !this.#selfRef.nativeElement.contains(activeElement)) {
        this.tabbedOut.emit();
      }
    });
  }
}
