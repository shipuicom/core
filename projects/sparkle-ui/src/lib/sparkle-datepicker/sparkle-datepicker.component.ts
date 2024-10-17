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
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'spk-datepicker',
  standalone: true,
  imports: [SparkleIconComponent],
  template: `
    <header>
      <button (click)="previousMonth()"><spk-icon>caret-left</spk-icon></button>
      <div class="title">{{ getMonthName(currentDate()) }} {{ getFullYear(currentDate()) }}</div>
      <button (click)="nextMonth()"><spk-icon>caret-right</spk-icon></button>
    </header>

    <section>
      <nav class="weekdays">
        @for (day of weekdays(); track $index) {
          <div>{{ day }}</div>
        }
      </nav>

      <div class="days" #daysRef>
        @for (calDate of currentMonthDates(); track $index) {
          <div
            #elementRef
            [class.out-of-scope]="!isCurrentMonth(calDate)"
            [class.selected]="calDate.toDateString() === date().toDateString()"
            (click)="setDate(calDate, elementRef)">
            {{ calDate.getDate() }}
          </div>
        }

        <article class="days">
          <div class="selected-element" [style]="selectedDateStylePosition()"></div>
        </article>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleDatepickerComponent {
  #INIT_DATE = this.#getUTCDate(new Date());

  date = model<Date>(this.#INIT_DATE);
  startOfWeek = input<number>(1);
  weekdayLabels = input<string[]>(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);

  daysRef = viewChild<ElementRef<HTMLDivElement>>('daysRef');
  currentDate = signal<Date>(this.#INIT_DATE);
  currentMonthDates = computed(() => {
    const startOfWeek = this.startOfWeek();
    const currentDate = this.currentDate();

    return this.#generateMonthDates(currentDate, startOfWeek);
  });

  selectedDateStylePosition = signal<{ transform: string; opacity: string } | null>(null);

  weekdays = computed(() => {
    const startOfWeek = this.startOfWeek();
    const weekdayLabels = this.weekdayLabels();

    return weekdayLabels.slice(startOfWeek).concat(weekdayLabels.slice(0, startOfWeek));
  });

  #newDateEffect = effect(
    () => {
      this.currentDate.set(this.date());
      this.#findSelectedAndCalc();
    },
    {
      allowSignalWrites: true,
    }
  );

  #findSelectedAndCalc() {
    setTimeout(() => {
      const selectedElement = this.daysRef()?.nativeElement.querySelector('.selected');

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

  setDate(date: Date, selectedElement: HTMLDivElement) {
    const hours = this.date().getUTCHours();
    const minutes = this.date().getUTCMinutes();
    const seconds = this.date().getUTCSeconds();
    const milliseconds = this.date().getUTCMilliseconds();
    const newDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, seconds, milliseconds)
    );

    this.date.set(this.#getUTCDate(newDate));
    this.setSelectedDateStylePosition(selectedElement);
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

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate().getMonth();
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
