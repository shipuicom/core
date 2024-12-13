import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleFormFieldPopoverComponent } from '../sparkle-form-field/sparkle-form-field-popover.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparkleDatepickerComponent } from './sparkle-datepicker.component';

@Component({
  selector: 'spk-datepicker-input',
  imports: [SparkleDatepickerComponent, SparkleFormFieldPopoverComponent, SparkleIconComponent],
  providers: [DatePipe],
  template: `
    <spk-form-field-popover (click)="open($event)" (closed)="close()" [(isOpen)]="isOpen">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div class="input" ngProjectAs="input" #inputWrap>
        @if (this.masking()) {
          <div class="masked-value" (click)="open($event)">
            {{ _maskedDate() }}
          </div>
        }
        <ng-content select="input" />
      </div>

      <ng-content select="[textSuffix]" ngProjectAs="[textSuffix]" />
      <ng-content select="[suffix]" ngProjectAs="[suffix]" />
      <spk-icon class="default-indicator" suffix>calendar</spk-icon>

      <div popoverContent>
        @if (this.isOpen()) {
          <spk-datepicker [date]="internalDate()" (dateChange)="onDateChange($event)" [class]="styleClasses()" />
        }
      </div>
    </spk-form-field-popover>

    <ng-template #defaultIndicator></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleDatepickerInputComponent {
  #datePipe = inject(DatePipe);
  #elementRef = inject(ElementRef<SparkleDatepickerInputComponent>);
  #inputRef = signal<HTMLInputElement | null>(null);
  #triggerInput = signal(false);
  inputWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrap');

  masking = input('mediumDate');
  closed = output<Date>();

  _maskedDate = computed(() => {
    const date = this.internalDate();
    const mask = this.masking();

    if (!mask) return date;
    if (!date) return null;

    return this.#datePipe.transform(date, mask);
  });

  internalDate = signal<Date>(new Date());
  isOpen = model<boolean>(false);
  styleClasses = signal(null);

  #styleObserver =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const classString = this.#elementRef.nativeElement.classList.value;

          let classObj = classString.split(' ').reduce((acc: any, className: string) => {
            acc[className] = true;
            return acc;
          }, {});

          this.styleClasses.set(classObj);
        }
      });
    });

  #inputObserver =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      for (var mutation of mutations) {
        if (mutation.type == 'childList' && (mutation.target as HTMLElement).classList.contains('input')) {
          this.#triggerInput.set(!this.#triggerInput());
        }
      }
    });

  onDateChange(date: Date) {
    this.internalDate.set(date);
    const input = this.#inputRef();

    if (input) {
      input.value = date.toUTCString();
    }
  }

  open($event: MouseEvent) {
    $event.stopPropagation();

    this.isOpen.set(true);
  }

  close() {
    this.closed.emit(this.internalDate());
  }

  ngOnInit() {
    this.styleClasses.set(this.#elementRef.nativeElement.classList.value);

    if (typeof MutationObserver !== 'undefined') {
      (this.#styleObserver as MutationObserver).observe(this.#elementRef.nativeElement, { attributes: true });
      (this.#inputObserver as MutationObserver).observe(this.inputWrapRef().nativeElement, {
        attributes: true,
        childList: true,
      });
    }
  }

  #inputRefEffect = effect(() => {
    this.#triggerInput();
    const input = this.inputWrapRef()?.nativeElement.querySelector('input');

    if (!input) return;

    this.#createCustomInputEventListener(input);

    input.addEventListener('inputValueChanged', (event) => {
      this.internalDate.set(new Date(event.detail.value));
    });

    input.addEventListener('focus', () => {
      this.isOpen.set(true);
      input.blur();
    });

    this.#inputRef.set(input);
    input.autocomplete = 'off';

    if (typeof input.value === 'string') {
      this.internalDate.set(new Date(input.value));
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

  ngOnDestroy() {
    this.#styleObserver && this.#styleObserver.disconnect();
    this.#inputObserver && this.#inputObserver.disconnect();
  }
}
