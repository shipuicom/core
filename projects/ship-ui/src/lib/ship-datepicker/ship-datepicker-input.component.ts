import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { ShipFormFieldPopoverComponent } from '../ship-form-field/ship-form-field-popover.component';
import { ShipIconComponent } from '../ship-icon/ship-icon.component';
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { contentProjectionSignal } from '../utilities/content-projection-signal';
import { ShipDatepickerComponent } from './ship-datepicker.component';

@Component({
  selector: 'sh-datepicker-input',
  imports: [ShipDatepickerComponent, ShipFormFieldPopoverComponent, ShipIconComponent],
  providers: [DatePipe],
  template: `
    <sh-form-field-popover (click)="open($event)" (closed)="close()" [(isOpen)]="isOpen">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div id="input-wrap" class="input" ngProjectAs="input">
        @if (this.masking()) {
          <div class="masked-value" (click)="open($event)">
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
          <sh-datepicker [date]="internalDate()" (dateChange)="onDateChange($event)" [class]="currentClass()" />
        }
      </div>
    </sh-form-field-popover>

    <ng-template #defaultIndicator></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDatepickerInputComponent {
  #INIT_DATE = this.#getUTCDate(new Date());

  ngModels = contentChild<NgModel>(NgModel);
  #datePipe = inject(DatePipe);
  #elementRef = inject(ElementRef<ShipDatepickerInputComponent>);
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

  internalDate = signal<Date | null>(this.#INIT_DATE);
  isOpen = model<boolean>(false);
  currentClass = classMutationSignal();
  #inputObserver = contentProjectionSignal<HTMLInputElement>(this.#elementRef.nativeElement, '#input-wrap input');

  onDateChange(date: Date | null) {
    this.internalDate.set(date);
    const input = this.#inputRef();

    if (input) {
      input.value = date ? date.toString() : '';
      input.dispatchEvent(new Event('input'));
    }
  }

  open($event: MouseEvent) {
    $event.stopPropagation();

    this.isOpen.set(true);
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
      this.internalDate.set(event.detail.value ? this.#getUTCDate(new Date(event.detail.value)) : null);
    });

    input.addEventListener('focus', () => {
      this.isOpen.set(true);
      input.blur();
    });

    this.#inputRef.set(input);
    input.autocomplete = 'off';

    if (typeof input.value === 'string') {
      this.internalDate.set(input.value ? this.#getUTCDate(new Date(input.value)) : null);
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
