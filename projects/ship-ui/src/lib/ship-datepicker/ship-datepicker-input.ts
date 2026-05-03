import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { ShipFormFieldPopover } from '../ship-form-field/ship-form-field-popover';
import { ShipIcon } from '../ship-icon/ship-icon';
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { contentProjectionSignal } from '../utilities/content-projection-signal';
import { ShipDatepicker } from './ship-datepicker';

@Component({
  selector: 'sh-datepicker-input',
  imports: [ShipDatepicker, ShipFormFieldPopover, ShipIcon],
  providers: [DatePipe],
  template: `
    <sh-form-field-popover (closed)="close()" [(isOpen)]="isOpen">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div id="input-wrap" class="input" ngProjectAs="input">
        @if (this.masking()) {
          <div class="masked-value">
            {{ _maskedDate() }}
          </div>
        }
        <ng-content select="input" />
      </div>

      <ng-content select="[textSuffix]" ngProjectAs="[textSuffix]" />
      <ng-content select="[suffix]" ngProjectAs="[suffix]" />
      <sh-icon class="default-indicator" suffix>calendar</sh-icon>

      <div popoverContent>
        @if (this.isOpen()) {
          <sh-datepicker [date]="internalDate()" (dateChange)="onDateChange($event)" (tabbedOut)="isOpen.set(false)" [class]="currentClass()" />
        }
      </div>
    </sh-form-field-popover>

    <ng-template #defaultIndicator></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDatepickerInput {
  // #INIT_DATE = this.#getUTCDate(new Date());

  #selfRef = inject(ElementRef);
  ngControl = contentChild(NgControl);
  #datePipe = inject(DatePipe);
  #inputRef = signal<HTMLInputElement | null>(null);

  masking = input('mediumDate');
  closed = output<Date | null>();

  _maskedDate = computed(() => {
    const date = this.internalDate();
    const mask = this.masking();

    if (!mask) return date;
    if (!date) return null;

    return this.#datePipe.transform(date, mask);
  });

  internalDate = signal<Date | null>(null);
  isOpen = model<boolean>(false);
  currentClass = classMutationSignal();
  #inputObserver = contentProjectionSignal<HTMLInputElement>('#input-wrap input');
  datepicker = viewChild(ShipDatepicker);

  #isOpenEffect = effect(() => {
    if (this.isOpen()) {
      setTimeout(() => {
        this.datepicker()?.focusActiveDate();
      }, 50);
    }
  });

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

  onDateChange(date: Date | null) {
    this.internalDate.set(date);

    const control = this.ngControl()?.control;

    if (control) {
      control.setValue(date);
    } else {
      const input = this.#inputRef();
      if (input) {
        input.value = date ? date.toString() : '';
        input.dispatchEvent(new Event('input'));
      }
    }
  }

  close() {
    this.closed.emit(this.internalDate());
  }

  #inputRefEffect = effect(() => {
    const inputs = this.#inputObserver();

    if (!inputs.length) return;

    const input = inputs[0];

    if (!input) return;

    this.#createCustomInputEventListener(input);

    input.addEventListener('inputValueChanged', (event: any) => {
      const val = event.detail.value;
      if (!val) {
        this.internalDate.set(null);
        return;
      }
      
      let newD = new Date(val);
      
      if (isNaN(newD.getTime())) {
        // If it's a time-only string like "14:30" or "14:30:00"
        if (typeof val === 'string' && /^(\d{2}):(\d{2})/.test(val)) {
          const match = val.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
          if (match) {
            const current = this.internalDate() || new Date();
            newD = new Date(current);
            newD.setHours(parseInt(match[1], 10), parseInt(match[2], 10), match[3] ? parseInt(match[3], 10) : 0, 0);
          }
        }
      }
      
      if (!isNaN(newD.getTime())) {
        this.internalDate.set(newD);
      }
    });

    input.addEventListener('focus', () => {
      this.isOpen.set(true);
      // Removed input.blur() so users can actually type or use Shift+Tab to navigate backward
    });

    this.#inputRef.set(input);
    input.autocomplete = 'off';

    if (typeof input.value === 'string') {
      this.internalDate.set(input.value ? new Date(input.value) : null);
    }
  });

  #createCustomInputEventListener(input: HTMLInputElement) {
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        return descriptor!.get!.call(this);
      },
      set(newVal) {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        descriptor!.set!.call(this, newVal);

        const inputEvent = new CustomEvent('inputValueChanged', {
          bubbles: true,
          cancelable: true,
          detail: {
            value: newVal,
          },
        });

        this.dispatchEvent(inputEvent);

        return newVal;
      },
    });

    return input;
  }
}
