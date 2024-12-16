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
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleChipComponent } from '../sparkle-chip/sparkle-chip.component';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparklePopoverComponent } from '../sparkle-popover/sparkle-popover.component';

type InputValueChangedEvent = CustomEvent<{ value: string }>;

interface CustomEventMap {
  inputValueChanged: InputValueChangedEvent;
}

declare global {
  interface HTMLInputElement {
    // Extend HTMLElement to cover input elements
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: CustomEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
  }
}

@Component({
  selector: 'spk-option',
  standalone: true,
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleOptionComponent {
  #selfRef = inject(ElementRef<HTMLElement>);

  value = input<string | number | Date | null | undefined>(null);

  // Bind value property to the html element

  #valueEffect = effect(() => {
    this.#selfRef.nativeElement.value = this.value();
  });

  // Bind html element methods
  hasAttribute(attribute: string) {
    return this.#selfRef.nativeElement.hasAttribute(attribute);
  }

  removeAttribute(attribute: string) {
    this.#selfRef.nativeElement.removeAttribute(attribute);
  }

  setAttribute(attribute: string, value: string) {
    this.#selfRef.nativeElement.setAttribute(attribute, value);
  }

  getAttribute(attribute: string) {
    return this.#selfRef.nativeElement.getAttribute(attribute);
  }

  addClass(className: string) {
    this.#selfRef.nativeElement.classList.add(className);
  }

  removeClass(className: string) {
    this.#selfRef.nativeElement.classList.remove(className);
  }

  scrollIntoView(options?: ScrollIntoViewOptions) {
    this.#selfRef.nativeElement.scrollIntoView(options);
  }
}

const COLOR_CLASSES = ['primary', 'accent', 'tertiary', 'warn', 'success'];

@Component({
  selector: 'spk-select',
  imports: [SparkleFormFieldComponent, SparkleIconComponent, SparkleChipComponent, SparklePopoverComponent],
  template: `
    <spk-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: false,
      }">
      <spk-form-field trigger (click)="open($event)" [class]="readonly() ? 'readonly' : ''">
        <ng-content select="label" ngProjectAs="label"></ng-content>

        <div class="input" ngProjectAs="input" #inputWrap>
          @if (selectMultiple()) {
            <div class="display-value">
              @if (inputValue().length > 0) {
                @for (option of inputValue().split(','); track $index) {
                  <spk-chip class="small simple" [class]="chipClass()" (click)="toggleOption(option, $event)">
                    {{ displayFn()?.(option) ?? option }}
                    <spk-icon>x-circle</spk-icon>
                  </spk-chip>
                }
              }
            </div>
          } @else if ((_displayValue() && isSearchInput() && !isOpen()) || (_displayValue() && !isSearchInput())) {
            <div class="display-value">{{ _displayValue() }}</div>
          }
          <ng-content select="input"></ng-content>
        </div>

        @if (((inputValue() && !isOpen() && inputValue()!.length > 0) || !!selectedOption()) && !hideClearButton()) {
          <div class="deselect-indicator" (click)="deselect($event)" suffix>
            <ng-content select="[deselect-indicator]"></ng-content>
            <spk-icon class="default-indicator">x-circle</spk-icon>
          </div>
        } @else if (isSearchInput() && !selectedOption()) {
          <div class="search-indicator" suffix>
            <ng-content select="[search-indicator]"></ng-content>
            <spk-icon class="default-indicator">magnifying-glass</spk-icon>
          </div>
        } @else {
          <div class="select-open-indicator" [class.open]="isOpen()" suffix>
            <ng-content select="[open-indicator]"></ng-content>
            <spk-icon class="default-indicator">caret-down</spk-icon>
          </div>
        }
      </spk-form-field>

      <div class="sparkle-options" #optionsRef>
        <ng-content />
      </div>
    </spk-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSelectComponent {
  #renderer = inject(Renderer2);
  #selfRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  optionsRef = viewChild<ElementRef<HTMLDivElement>>('optionsRef');
  options = contentChildren(SparkleOptionComponent);
  formFieldWrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('formFieldWrapper');
  inputWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrap');

  inputValue = model<string>('');
  readonly = input<boolean>(false);
  isFreeText = input<boolean>(false);
  selectMultiple = input<boolean>(false);
  hideClearButton = input<boolean>(false);
  displayValue = input<string | null>('');
  // TODO add an option where it returns key and value instead of just value
  displayFn = input<Function | null>((option: any) => `${option}`);
  above = input<boolean>(false);
  right = input<boolean>(false);

  change = output<string>();

  #triggerInput = signal(false);
  #inputRef = signal<HTMLInputElement | null>(null);

  #previousInputValue = signal<string | null>(null);
  #hasBeenOpened = signal(false);
  #optionInFocus = signal<number>(-1);
  isOpen = signal(false);
  _isOpen = signal(false);

  isSearchInput = computed(() => this.#inputRef()?.type === 'search');

  chipClass = computed(() =>
    Array.from(this.#selfRef.nativeElement.classList)
      .filter((x) => COLOR_CLASSES.includes(x))
      .join(' ')
  );

  _displayValue = computed(() =>
    this.displayFn() ? this.displayFn()!(this.inputValue()) : (this.displayValue() ?? this.inputValue())
  );

  selectedOption = computed(() =>
    this.#previousInputValue()
      ? this.options().find((x) => {
          const value = x.value(); //x.getAttribute('value') || x.getAttribute('ng-reflect-value');
          return value === this.#previousInputValue();
        })
      : null
  );

  optionsOpenController: AbortController | null = null;
  inputController: AbortController | null = null;
  clickController: AbortController | null = null;
  inputAbortController: AbortController | null = null;

  #inputRefEffect = effect(() => {
    this.#triggerInput();
    const input = this.#selfRef.nativeElement.querySelector('input');

    if (!input) return;

    this.#createCustomInputEventListener(input);

    input.addEventListener('inputValueChanged', (event) => {
      this.inputValue.set(event.detail.value);

      if (this.selectMultiple()) {
        this.#updateValueFromInput();
      }
    });

    this.#inputRef.set(input);
    input.autocomplete = 'off';

    if (typeof input.value === 'string') {
      this.inputValue.set(input.value);
    }
  });

  #onNewInputRef = effect(() => {
    if (this.inputController) {
      this.inputController.abort();
    }

    this.inputController = new AbortController();

    const input = this.#inputRef();

    if (input) {
      input.addEventListener(
        'keydown',
        (e) => {
          if (this.selectMultiple() || (!this.isSearchInput() && !this.isFreeText())) {
            e.preventDefault();
          }

          if (e.key === 'Escape') {
            this.close();
          } else if (e.key === 'ArrowDown') {
            if (
              this.#optionInFocus() === null ||
              this.#optionInFocus() < 0 ||
              (this.#optionInFocus() as number) === this.options().length - 1
            ) {
              this.#optionInFocus.set(this.#getIndexOfFirstNonDeselectedOption());
            } else {
              this.#optionInFocus.set((this.#optionInFocus() as number) + 1);
            }
          } else if (e.key === 'ArrowUp') {
            if (
              this.#optionInFocus() === null ||
              this.#optionInFocus() < 0 ||
              (this.#optionInFocus() as number) === 0
            ) {
              this.#optionInFocus.set(this.options().length - 1);
            } else {
              this.#optionInFocus.set((this.#optionInFocus() as number) - 1);
            }
          } else if (e.key === 'Enter') {
            if (this.isFreeText()) {
              this.close(true);
            }
            if (this.#optionInFocus() > -1) {
              this.selected(this.getOptionElement(this.#optionInFocus() as number));
            }
          } else if (e.key === 'Tab') {
            this.close(true);
          } else {
            this.#optionInFocus.set(-1);

            if (this.isFreeText()) {
              this.calculateSelectedOptions();
            }
          }
        },
        {
          signal: this.inputController?.signal,
        }
      );
    }
  });

  #optionInFocusEffect = effect(() => {
    const open = this.isOpen();

    if (open) {
      this.#computeFocusedElement();
    }
  });

  #whenInputValueChanged = effect(() => {
    const val = this.inputValue();

    if (this.#inputRef()) {
      this.#inputRef()!.value = val ?? '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
    }
  });

  ngOnInit() {
    if (typeof MutationObserver !== 'undefined') {
      (this.#inputObserver as MutationObserver).observe(this.inputWrapRef().nativeElement, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }
  }

  getOptionElement(index: number) {
    return this.options()[index];
  }

  deselect($event: Event | null | undefined, forceClose = false) {
    $event?.stopPropagation();

    if (this.#inputRef()) {
      this.#inputRef()!.value = '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
    }

    this.#optionInFocus.set(this.#getIndexOfFirstNonDeselectedOption());
    this.#hasBeenOpened.set(false);

    if (forceClose || !this.selectMultiple()) {
      this.isOpen.set(false);
      this.#inputRef()?.blur();
    }
  }

  selected(el: SparkleOptionComponent) {
    if (!el) return;

    const newSelectedValue = el.value() as string; //(el.getAttribute('value') || el.getAttribute('ng-reflect-value')) ?? '';
    const elIndex = this.options().indexOf(el);

    if (el.hasAttribute('deselect')) {
      return this.deselect(null, true);
    }

    this.#optionInFocus.set(elIndex);

    if (el && !this.selectMultiple()) {
      this.inputValue.set(newSelectedValue);

      for (let i = 0; i < this.options().length; i++) {
        const option = this.options()[i];
        const optionValue = option.value(); //option.getAttribute('value') || option.getAttribute('ng-reflect-value');

        if (optionValue === newSelectedValue) {
          this.#renderer.setAttribute(option, 'selected', 'selected');
        } else {
          this.#renderer.removeAttribute(option, 'selected');
        }
      }
    } else if (el && this.selectMultiple()) {
      if (this.inputValue().includes(newSelectedValue)) {
        this.#renderer.removeAttribute(el, 'selected');
        this.toggleOption(newSelectedValue);
      } else {
        this.#renderer.setAttribute(el, 'selected', 'selected');
        this.inputValue.set(this.inputValue().length ? `${this.inputValue()},${newSelectedValue}` : newSelectedValue);
      }
    }

    this.#hasBeenOpened.set(false);
    this.#previousInputValue.set(null);

    if (this.selectMultiple()) {
      this.#inputRef()?.focus();
    } else {
      this.isOpen.set(false);
      this.#inputRef()?.blur();
    }

    this.change.emit(this.inputValue());
  }

  calculateSelectedOptions() {
    setTimeout(() => {
      const options = this.options();
      const inputRef = this.#inputRef();
      const value = inputRef?.value;

      for (let index = 0; index < options.length; index++) {
        const option = options[index];
        const optionValue = option.value(); //option.getAttribute('value') || option.getAttribute('ng-reflect-value');

        if (optionValue === value) {
          this.#renderer.setAttribute(option, 'selected', 'selected');
        } else {
          this.#renderer.removeAttribute(option, 'selected');
        }
      }
    });
  }

  toggleOption(option: string, $event?: Event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }

    this.inputValue.set(
      this.inputValue().startsWith(option + ',')
        ? this.inputValue().replace(option + ',', '')
        : this.inputValue().includes(',' + option)
          ? this.inputValue().replace(',' + option, '')
          : this.inputValue().replace(option, '')
    );
  }

  close(noBlur = false) {
    // this.#triggerOption.set(!this.#triggerOption());
    const prevValue = this.#previousInputValue();

    if (this.isSearchInput() && !this.isFreeText() && prevValue) {
      setTimeout(() => this.inputValue.set(prevValue));
    }

    this.isOpen.set(false);

    this.#hasBeenOpened.set(false);
    noBlur || this.#inputRef()?.blur();
    this.#killClickController();
  }

  open(e: MouseEvent | FocusEvent) {
    e.preventDefault();

    if (this.isOpen()) return;

    if (this.isSearchInput() && !this.#hasBeenOpened() && !this.isFreeText()) {
      this.#previousInputValue.set(this.inputValue());
      this.inputValue.set('');
      this.#inputRef()!.focus();
      this.#inputRef()!.value = '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
      this.#optionInFocus.set(-1);
    } else if (this.isSearchInput() || this.selectMultiple()) {
      this.#inputRef()!.focus();
    }

    this.isOpen.set(true);
    this.#hasBeenOpened.set(true);
    this.#listenForClicks();
    this.#updateValueFromInput();
  }

  #listenForClicks() {
    if (this.clickController) {
      this.clickController.abort();
    }

    this.clickController = new AbortController();

    this.optionsRef()?.nativeElement?.addEventListener(
      'click',
      (e) => {
        if (!e.target) return;

        const closestSpkOption = (e.target as HTMLElement).closest('spk-option') as any as SparkleOptionComponent;
        const option = this.options().find((x) => (x.value() as any) === closestSpkOption.value);

        if (option) {
          this.selected(option);
        }
      },
      { signal: this.clickController?.signal }
    );
  }

  #killClickController() {
    if (this.clickController) {
      this.clickController.abort();
    }
  }

  #computeFocusedElement() {
    for (let i = 0; i < this.options().length; i++) {
      const option = this.options()[i];

      option.removeClass('focused');

      if (this.#optionInFocus() === i) {
        option.addClass('focused');
        option.scrollIntoView({ block: 'center' });
      }
    }
  }

  #updateValueFromInput() {
    const input = this.#inputRef();

    if (!input) return;

    this.inputValue.set(input.value);

    const inputOptions = input.value.split(',');

    setTimeout(() => {
      const options = this.options();

      for (let index = 0; index < options.length; index++) {
        const val = options[index].value();

        if (val && inputOptions.includes(val as string)) {
          this.#renderer.setAttribute(options[index], 'selected', 'selected');
        } else {
          this.#renderer.removeAttribute(options[index], 'selected');
        }
      }
    });
  }

  #getIndexOfFirstNonDeselectedOption() {
    const options = this.options();

    for (let i = 0; i < options.length; i++) {
      if (!options[i].hasAttribute('deselect')) {
        return i;
      }
    }

    return -1;
  }

  #inputObserver =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      for (var mutation of mutations) {
        if (mutation.type == 'childList' && (mutation.target as HTMLElement).classList.contains('input')) {
          this.#triggerInput.set(!this.#triggerInput());
        }
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
    if (this.clickController) {
      this.clickController.abort();
    }

    if (this.inputController) {
      this.inputController.abort();
    }

    if (this.optionsOpenController) {
      this.optionsOpenController.abort();
    }

    if (typeof MutationObserver !== 'undefined') {
      (this.#inputObserver as MutationObserver).disconnect();
    }
  }
}
