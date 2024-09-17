import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleChipComponent } from '../sparkle-chip/sparkle-chip.component';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

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
  value = input<string | null>(null);
}

const COLOR_CLASSES = ['primary', 'accent', 'tertiary', 'warn', 'success'];

@Component({
  selector: 'spk-select',
  standalone: true,
  imports: [SparkleFormFieldComponent, SparkleIconComponent, SparkleOptionComponent, SparkleChipComponent, NgClass],
  template: `
    <div #formFieldWrapper>
      <spk-form-field (click)="open($event)">
        <ng-content select="label" ngProjectAs="label"></ng-content>

        <div class="input" ngProjectAs="input" #inputWrap>
          @if (selectMultiple()) {
            <div class="display-value">
              @if (inputValue().length > 0) {
                @for (option of inputValue().split(','); track $index) {
                  <spk-chip class="small simple" [ngClass]="chipClass()" (click)="toggleOption(option, $event)">
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
          <div class="deselect-indicator" (click)="deselect($event)" spkSuffix>
            <ng-content select="[deselect-indicator]"></ng-content>
            <spk-icon class="default-indicator">x-circle</spk-icon>
          </div>
        } @else if (isSearchInput() && !selectedOption()) {
          <div class="search-indicator" spkSuffix>
            <ng-content select="[search-indicator]"></ng-content>
            <spk-icon class="default-indicator">magnifying-glass</spk-icon>
          </div>
        } @else {
          <div class="select-open-indicator" [class.open]="isOpen()" spkSuffix>
            <ng-content select="[open-indicator]"></ng-content>
            <spk-icon class="default-indicator">caret-down</spk-icon>
          </div>
        }
      </spk-form-field>
    </div>

    @if (isOpen()) {
      <div class="sparkle-popup-menu" [class.active]="delayedIsOpen()" #optionsRef [style]="optionsStyle()">
        <div class="sparkle-options-backdrop" (click)="close()"></div>
        <div class="sparkle-options">
          <div class="sparkle-options-placerholder"><ng-content select="[placeholder-text]" /></div>
          <ng-content select="[options]"></ng-content>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSelectComponent {
  #BASE_SPACE = 8;
  #renderer = inject(Renderer2);
  #body = document.getElementsByTagName('body')[0];
  #selfRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  optionsRef = viewChild<ElementRef<HTMLDivElement>>('optionsRef');
  formFieldWrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('formFieldWrapper');
  inputWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrap');

  inputValue = model<string>('');
  selectMultiple = input<boolean>(false);
  hideClearButton = input<boolean>(false);
  displayValue = input<string | null>('');
  displayFn = input<Function | null>(null);
  above = input<boolean>(false);
  right = input<boolean>(false);

  // TODO refactor these signals and their effects to be a computed that returns a signal instead of using effects
  #triggerInput = signal(false);
  #triggerOption = signal(false);
  #inputRef = signal<HTMLInputElement | null>(null);

  #previousInputValue = signal<string>('');
  #firstOptionIndex = signal<number>(-1);
  #hasBeenOpened = signal(false);
  #optionInFocus = signal<number>(-1);
  isOpen = signal(false);
  delayedIsOpen = signal(false);
  optionsStyle = signal({
    left: '0px',
    top: '0px',
  });

  isSearchInput = computed(() => this.#inputRef()?.type === 'search');
  optionsEl = computed(() => this.optionsRef()?.nativeElement);
  #options = computed(() => {
    this.#triggerOption();

    const options = this.optionsRef()?.nativeElement.querySelectorAll<HTMLOptionElement>('option');
    const spkOptions = this.optionsRef()?.nativeElement.querySelectorAll<HTMLElement>('spk-option');

    if (options?.length) {
      return Array.from(options);
    } else if (spkOptions?.length) {
      return Array.from(spkOptions);
    }

    return [];
  });
  chipClass = computed(() =>
    Array.from(this.#selfRef.nativeElement.classList)
      .filter((x) => COLOR_CLASSES.includes(x))
      .join(' ')
  );
  _displayValue = computed(() =>
    this.displayFn() ? this.displayFn()!(this.inputValue()) : this.displayValue() ?? this.inputValue()
  );
  selectedOption = computed(() =>
    this.#previousInputValue()
      ? this.#options().find((x) => x.getAttribute('value') === this.#previousInputValue())
      : null
  );

  optionsOpenController: AbortController | null = null;
  inputController: AbortController | null = null;
  clickController: AbortController | null = null;
  inputAbortController: AbortController | null = null;

  #inputRefEffect = effect(
    () => {
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
    },
    { allowSignalWrites: true }
  );

  #onNewInputRef = effect(() => {
    if (this.inputController) {
      this.inputController.abort();
    }

    this.inputController = new AbortController();

    const input = this.#inputRef();

    if (input) {
      input.addEventListener('focus', (e: FocusEvent) => this.open(e), {
        signal: this.inputController?.signal,
      });

      input.addEventListener(
        'keydown',
        (e) => {
          if (this.selectMultiple() || !this.isSearchInput()) {
            e.preventDefault();
          }

          if (e.key === 'Escape') {
            this.close();
          } else if (e.key === 'ArrowDown') {
            if (
              this.#optionInFocus() === null ||
              this.#optionInFocus() < 0 ||
              (this.#optionInFocus() as number) === this.#options().length - 1
            ) {
              this.#optionInFocus.set(this.#firstOptionIndex());
            } else {
              this.#optionInFocus.set((this.#optionInFocus() as number) + 1);
            }
          } else if (e.key === 'ArrowUp') {
            if (
              this.#optionInFocus() === null ||
              this.#optionInFocus() < 0 ||
              (this.#optionInFocus() as number) === 0
            ) {
              this.#optionInFocus.set(this.#options().length - 1);
            } else {
              this.#optionInFocus.set((this.#optionInFocus() as number) - 1);
            }
          } else if (e.key === 'Enter') {
            if (this.#optionInFocus() > -1) {
              this.selected(this.getOptionElement(this.#optionInFocus() as number));
            }
          } else if (e.key === 'Tab') {
            this.close(true);
          }
        },
        {
          signal: this.inputController?.signal,
        }
      );
    }
  });

  #optionInFocusEffect = effect(() => {
    if (this.isOpen()) {
      this.#computeFocusedElement();
    }

    setTimeout(() => {
      this.delayedIsOpen.set(this.isOpen());
    }, 0);
  });

  #whenInputValueChanged = effect(
    () => {
      const val = this.inputValue();

      if (this.#inputRef()) {
        this.#inputRef()!.value = val ?? '';
        this.#inputRef()!.dispatchEvent(new Event('input'));
      }
    },
    { allowSignalWrites: true }
  );

  ngOnInit() {
    this.#setOptionsElement();

    this.#inputObserver.observe(this.inputWrapRef().nativeElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  getOptionElement(index: number) {
    return this.#options()[index];
  }

  deselect($event: Event | null | undefined, forceClose = false) {
    $event?.stopPropagation();

    if (this.#inputRef()) {
      this.#inputRef()!.value = '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
    }

    this.#optionInFocus.set(this.#firstOptionIndex());
    this.#hasBeenOpened.set(false);

    if (forceClose || !this.selectMultiple()) {
      this.isOpen.set(false);
      this.#inputRef()?.blur();
    }
  }

  selected(el: HTMLElement) {
    if (!el) return;

    const newSelectedValue = (el.getAttribute('value') || el.getAttribute('ng-reflect-value')) ?? '';
    const elIndex = this.#options().indexOf(el);

    if (el.hasAttribute('deselect')) {
      return this.deselect(null, true);
    }

    this.#optionInFocus.set(elIndex);

    if (el && !this.selectMultiple()) {
      this.inputValue.set(newSelectedValue);

      for (let i = 0; i < this.#options().length; i++) {
        const option = this.#options()[i];

        if (option.getAttribute('value') === newSelectedValue) {
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

    if (this.selectMultiple()) {
      setTimeout(() => this.#inputRef()?.focus());
    } else {
      this.isOpen.set(false);
      this.#inputRef()?.blur();
    }
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
    if (this.isSearchInput() && this.#previousInputValue()) {
      setTimeout(() => this.inputValue.set(this.#previousInputValue()));
    }

    this.#hideOptionsElement();

    this.isOpen.set(false);
    this.#hasBeenOpened.set(false);
    noBlur || this.#inputRef()?.blur();
    this.#killMenuCalculation();
    this.#killClickController();
  }

  open(e: MouseEvent | FocusEvent) {
    e.preventDefault();

    this.isOpen.set(true);
    this.#setOptionsElement();

    if (this.isSearchInput() && !this.#hasBeenOpened()) {
      this.#previousInputValue.set(this.inputValue());
      this.inputValue.set('');
      this.#inputRef()!.focus();
      this.#inputRef()!.value = '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
      this.#optionInFocus.set(-1);
    } else if (this.isSearchInput() || this.selectMultiple()) {
      this.#inputRef()!.focus();
    }

    this.#hasBeenOpened.set(true);
    this.#initMenuCalculation();
    this.#listenForClicks();
    this.#triggerOption.set(!this.#triggerOption());
    this.#updateValueFromInput();
  }

  #listenForClicks() {
    if (this.clickController) {
      this.clickController.abort();
    }

    this.clickController = new AbortController();

    window.addEventListener(
      'click',
      (e) => {
        if (!e.target) return;

        const closestOption = (e.target as HTMLElement).closest('option');
        const closestSpkOption = (e.target as HTMLElement).closest('spk-option');

        const option = closestOption || closestSpkOption;
        const indexOfOption = this.#options().indexOf(option as HTMLElement);

        if (indexOfOption > -1) {
          this.selected(option as HTMLElement);
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
    for (let i = 0; i < this.#options().length; i++) {
      const option = this.#options()[i];

      this.#renderer.removeClass(option, 'focused');

      if (this.#optionInFocus() === i) {
        this.#renderer.addClass(option, 'focused');
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
      const options = this.#options();

      for (let index = 0; index < options.length; index++) {
        const val = options[index].getAttribute('ng-reflect-value');

        if (val && inputOptions.includes(val)) {
          this.#renderer.setAttribute(options[index], 'selected', 'selected');
        } else {
          this.#renderer.removeAttribute(options[index], 'selected');
        }
      }
    });
  }

  #setOptionsElement() {
    setTimeout(() => {
      if (this.optionsEl()) {
        this.#renderer.appendChild(this.#body, this.optionsEl()!);
        this.#firstOptionIndex.set(this.#getIndexOfFirstNonDeselectedOption());
        this.#triggerOption.set(!this.#triggerOption());
      }
    });
  }

  #getIndexOfFirstNonDeselectedOption() {
    const options = this.#options();

    for (let i = 0; i < options.length; i++) {
      if (!options[i].hasAttribute('deselect')) {
        return i;
      }
    }

    return -1;
  }

  #hideOptionsElement() {
    setTimeout(() => {
      if (this.optionsEl()) {
        this.#renderer.removeChild(this.#body, this.optionsEl()!);
        this.#triggerOption.set(!this.#triggerOption());
      }
    });
  }

  #inputObserver = new MutationObserver((mutations) => {
    for (var mutation of mutations) {
      if (mutation.type == 'childList' && (mutation.target as HTMLElement).classList.contains('input')) {
        this.#triggerInput.set(!this.#triggerInput());
      }
      if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
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

  #initMenuCalculation() {
    this.optionsOpenController = new AbortController();

    setTimeout(() => this.#calculateMenuPosition());
    window.addEventListener('resize', () => this.#calculateMenuPosition(), {
      signal: this.optionsOpenController?.signal,
    });
    window.addEventListener('scroll', () => this.#calculateMenuPosition(), {
      signal: this.optionsOpenController?.signal,
    });
  }

  #killMenuCalculation() {
    if (this.optionsOpenController) {
      this.optionsOpenController.abort();
    }
  }

  #calculateMenuPosition() {
    if (this.optionsEl()) {
      const triggerRect = this.formFieldWrapperRef()?.nativeElement.getBoundingClientRect();
      const menuRect = this.optionsEl()!.getBoundingClientRect();

      const actionLeftInViewport = triggerRect.left;
      const actionBottomInViewport = triggerRect.bottom;

      let newLeft = actionLeftInViewport;
      let newTop = actionBottomInViewport + this.#BASE_SPACE;

      const outOfBoundsRight = newLeft + menuRect.width > window.innerWidth;
      const outOfBoundsBottom = newTop + menuRect.height > window.innerHeight;

      if (this.above()) {
        const _newTop = triggerRect.top - menuRect.height - this.#BASE_SPACE;

        if (_newTop >= 0) {
          newTop = _newTop;
        }
      } else {
        if (outOfBoundsBottom) {
          newTop = triggerRect.top - menuRect.height - this.#BASE_SPACE;
        }
      }

      if (this.right()) {
        const _newLeft = triggerRect.right - menuRect.width;

        if (_newLeft >= 0) {
          newLeft = _newLeft;
        }
      } else {
        if (outOfBoundsRight) {
          newTop = outOfBoundsBottom ? triggerRect.top + triggerRect.height - menuRect.height : triggerRect.top;
          newLeft = triggerRect.left - menuRect.width - this.#BASE_SPACE;
        }
      }

      this.optionsStyle.set({
        left: newLeft + 'px',
        top: newTop + 'px',
      });
    }
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

    this.#inputObserver.disconnect();
  }
}
