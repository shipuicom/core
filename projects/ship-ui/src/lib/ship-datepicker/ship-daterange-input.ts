import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { contentProjectionSignal } from '../utilities/content-projection-signal';
import { ShipFormFieldPopover } from '../ship-form-field/ship-form-field-popover';
import { ShipIcon } from '../ship-icon/ship-icon';
import { ShipDatepicker } from './ship-datepicker';

@Component({
  selector: 'sh-daterange-input',
  imports: [ShipDatepicker, ShipFormFieldPopover, ShipIcon],
  providers: [DatePipe],
  template: `
    <sh-form-field-popover [class]="'columns-' + monthsToShow()" (closed)="close()" [(isOpen)]="isOpen">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div class="input" ngProjectAs="input" #inputWrap [class.active-start]="isOpen() && activeInput() === 'start'" [class.active-end]="isOpen() && activeInput() === 'end'">
        @if (this.masking()) {
          <div class="masked-value" [class.active-start]="isOpen() && activeInput() === 'start'" [class.active-end]="isOpen() && activeInput() === 'end'">
            <span class="start-val">{{ _maskedStartDate() ?? 'N/A' }}</span>
            <span class="separator">-</span>
            <span class="end-val">{{ _maskedEndDate() ?? 'N/A' }}</span>
          </div>
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
            [activeRangeSelection]="activeInput()"
            [class]="classes"
            (dateChange)="onStartDateChange($event)"
            (endDateChange)="onEndDateChange($event)"
            (tabbedOut)="isOpen.set(false)"
            [monthsToShow]="monthsToShow()"
            [asRange]="true" />
        }
      </div>
    </sh-form-field-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDaterangeInput {
  #selfRef = inject(ElementRef);

  #inputObserver = contentProjectionSignal('input', {
    childList: true,
    subtree: true,
  });

  #datePipe = inject(DatePipe);
  monthsToShow = input<number>(1);
  masking = input('mediumDate');
  closed = output<{ start: Date | null; end: Date | null }>();

  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  activeInput = signal<'start' | 'end'>('start');
  isOpen = model<boolean>(false);
  datepicker = viewChild(ShipDatepicker);

  #isOpenEffect = effect(() => {
    if (this.isOpen()) {
      setTimeout(() => {
        this.datepicker()?.focusActiveDate();
      }, 50);
    }
  });

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
      const inputs = this.#inputObserver() as HTMLInputElement[];
      if (inputs.length === 0) return;

      if (inputs[0]) this.setupInput(inputs[0], true);
      if (inputs[1]) this.setupInput(inputs[1], false);
    });
  }

  private setupInput(element: HTMLInputElement, isStart: boolean) {
    if ((element as any)._hasCustomFocusEvent) return;
    (element as any)._hasCustomFocusEvent = true;

    element.autocomplete = 'off';
    
    // Set tabindex -1 on the second input to prevent users from having to Shift+Tab 
    // multiple times to exit the component when masking is enabled.
    if (!isStart) {
      element.tabIndex = -1;
    }

    element.addEventListener('focus', () => {
      this.activeInput.set(isStart ? 'start' : 'end');
      if ((element as any)._ignoreNextFocus) {
        (element as any)._ignoreNextFocus = false;
        return;
      }
      this.isOpen.set(true);
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

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement &&
        activeElement !== document.body &&
        !this.#selfRef.nativeElement.contains(activeElement)
      ) {
        this.isOpen.set(false);
      }
    });
  }

  onStartDateChange(date: Date | null) {
    this.startDate.set(date);
    const inputs = this.#inputObserver() as HTMLInputElement[];
    if (inputs[0]) this.updateInputValue([inputs[0]], date);
    
    // Automatically switch to end date selection
    this.activeInput.set('end');
  }

  onEndDateChange(date: Date | null) {
    this.endDate.set(date);
    const inputs = this.#inputObserver() as HTMLInputElement[];
    if (inputs[1]) this.updateInputValue([inputs[1]], date);

    if (this.startDate() && date) {
      this.isOpen.set(false);
      
      const inputs = this.#inputObserver() as HTMLInputElement[];
      if (inputs[0] && document.activeElement !== inputs[0]) {
        (inputs[0] as any)._ignoreNextFocus = true;
        inputs[0].focus();
      }
    }
  }

  private updateInputValue(inputs: HTMLInputElement[], date: Date | null) {
    inputs.forEach((input) => {
      if (this.masking()) {
        input.value = this.#datePipe.transform(date, this.masking()) ?? '';
      } else {
        input.value = date ? date.toUTCString() : '';
      }
      this.dispatchInputEvent(input);
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
