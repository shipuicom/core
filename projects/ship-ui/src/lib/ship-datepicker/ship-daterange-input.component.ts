import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ShipFormFieldPopoverComponent } from '../ship-form-field/ship-form-field-popover.component';
import { ShipIcon } from '../ship-icon/ship-icon';
import { ShipDatepickerComponent } from './ship-datepicker.component';

@Component({
  selector: 'sh-daterange-input',
  imports: [ShipDatepickerComponent, ShipFormFieldPopoverComponent, ShipIcon],
  providers: [DatePipe],
  template: `
    <sh-form-field-popover [class]="'columns-' + monthsToShow()" (closed)="close()" [(isOpen)]="isOpen">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div class="input" ngProjectAs="input" #inputWrap>
        @if (this.masking()) {
          <div class="masked-value">{{ _maskedStartDate() ?? 'N/A' }} - {{ _maskedEndDate() ?? 'N/A' }}</div>
        }
        <ng-content select="input" />
      </div>

      <ng-content select="[textSuffix]" ngProjectAs="[textSuffix]" />
      <ng-content select="[suffix]" ngProjectAs="[suffix]" />
      <sh-icon class="default-indicator" suffix>calendar</sh-icon>

      <div popoverContent>
        @if (this.isOpen()) {
          <sh-datepicker
            [date]="startDate()"
            [endDate]="endDate()"
            [class]="classes"
            (dateChange)="onStartDateChange($event)"
            (endDateChange)="onEndDateChange($event)"
            [monthsToShow]="monthsToShow()"
            [asRange]="true" />
        }
      </div>
    </sh-form-field-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDaterangeInputComponent {
  #selfRef = inject(ElementRef);

  startDateInputs = contentChildren<ElementRef<HTMLInputElement>>('startDate');
  endDateInputs = contentChildren<ElementRef<HTMLInputElement>>('endDate');

  #datePipe = inject(DatePipe);
  monthsToShow = input<number>(1);
  masking = input('mediumDate');
  closed = output<{ start: Date | null; end: Date | null }>();

  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  isOpen = model<boolean>(false);

  get classes() {
    return `${this.#selfRef.nativeElement.classList.value}`;
  }

  _maskedStartDate = computed(() => {
    const date = this.startDate();
    const mask = this.masking();
    if (!mask || !date) return null;
    return this.#datePipe.transform(date, mask);
  });

  _maskedEndDate = computed(() => {
    const date = this.endDate();
    const mask = this.masking();
    if (!mask || !date) return null;
    return this.#datePipe.transform(date, mask);
  });

  constructor() {
    effect(() => {
      // Setup start date inputs
      this.startDateInputs().forEach((input) => {
        this.setupInput(input, true);
      });

      // Setup end date inputs
      this.endDateInputs().forEach((input) => {
        this.setupInput(input, false);
      });
    });
  }

  private setupInput(input: ElementRef<HTMLInputElement>, isStart: boolean) {
    const element = input.nativeElement;
    element.autocomplete = 'off';

    element.addEventListener('focus', () => {
      this.isOpen.set(true);
      element.blur();
    });

    // Handle initial value
    if (element.value) {
      try {
        const date = new Date(element.value);
        if (!isNaN(date.getTime())) {
          if (isStart) {
            this.startDate.set(date);
          } else {
            this.endDate.set(date);
          }
        }
      } catch (e) {
        console.warn('Invalid date value:', element.value);
      }
    }
  }

  onStartDateChange(date: Date | null) {
    this.startDate.set(date);
    this.updateInputValue(this.startDateInputs() as ElementRef<HTMLInputElement>[], date);
  }

  onEndDateChange(date: Date | null) {
    this.endDate.set(date);
    this.updateInputValue(this.endDateInputs() as ElementRef<HTMLInputElement>[], date);

    if (this.startDate() && date) {
      this.isOpen.set(false);
    }
  }

  private updateInputValue(inputs: ElementRef<HTMLInputElement>[], date: Date | null) {
    inputs.forEach((input) => {
      if (this.masking()) {
        input.nativeElement.value = this.#datePipe.transform(date, this.masking()) ?? '';
      } else {
        input.nativeElement.value = date ? date.toUTCString() : '';
      }
      this.dispatchInputEvent(input.nativeElement);
    });
  }

  private dispatchInputEvent(input: HTMLInputElement) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  close() {
    this.closed.emit({
      start: this.startDate(),
      end: this.endDate(),
    });
  }
}
