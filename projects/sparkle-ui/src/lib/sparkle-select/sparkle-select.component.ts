import { NgTemplateOutlet } from '@angular/common';
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
  TemplateRef,
  viewChild,
} from '@angular/core';
import { SparkleCheckboxComponent } from '../sparkle-checkbox/sparkle-checkbox.component';
import { SparkleChipComponent } from '../sparkle-chip/sparkle-chip.component';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparklePopoverComponent } from '../sparkle-popover/sparkle-popover.component';
import { SparkleSpinnerComponent } from '../sparkle-spinner/sparkle-spinner.component';

@Component({
  selector: 'spk-select',
  imports: [
    NgTemplateOutlet,
    SparklePopoverComponent,
    SparkleFormFieldComponent,
    SparkleIconComponent,
    SparkleCheckboxComponent,
    SparkleSpinnerComponent,
    SparkleChipComponent,
  ],
  template: `
    @let _placeholderTemplate = placeholderTemplate();
    @let _optionTemplate = optionTemplate();
    @let _selectedOptionTemplate = selectedOptionTemplate();
    @let _inlineTemplate = inlineTemplate();
    @let _selectedOptions = selectedOptions();
    @let _inputState = inputState();

    @let _selOptionTemplate = _selectedOptionTemplate || _optionTemplate || _inlineTemplate;
    @let _listOptionTemplate = _optionTemplate || _inlineTemplate;
    @let _asChips = !asText() && selectMultiple();
    @let _showSearchText = isOpen() && hasSearch() && (_asChips || inputValue().length > 0);

    <spk-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: false,
      }">
      <spk-form-field
        trigger
        (click)="open()"
        [class.autosize]="selectMultiple()"
        [class.readonly]="readonly() || disabled()">
        <ng-content select="label" ngProjectAs="label" />

        <div class="input" [class.show-search-text]="_showSearchText" ngProjectAs="input">
          <div class="selected-value" [class.is-selected]="_inputState === 'selected'">
            @if (asFreeText() && inputValue().length > 0 && !isOpen()) {
              {{ inputValue() }}
            } @else if (_selectedOptions.length > 0) {
              @for (selectedOption of _selectedOptions; track $index) {
                @if (selectedOption) {
                  @if (_asChips) {
                    <spk-chip [class]="selectClasses()" class="small">
                      @if (_selOptionTemplate) {
                        <ng-container *ngTemplateOutlet="_selOptionTemplate; context: { $implicit: selectedOption }" />
                      } @else {
                        {{ getLabel(selectedOption) }}
                      }

                      <spk-icon (click)="removeSelectedOptionByIndex($event, $index)">x-bold</spk-icon>
                    </spk-chip>
                  } @else {
                    @if (!_showSearchText) {
                      @if (_selOptionTemplate) {
                        <ng-container *ngTemplateOutlet="_selOptionTemplate; context: { $implicit: selectedOption }" />
                      } @else {
                        {{ getLabel(selectedOption) }}
                      }
                    }
                  }
                }
              }
            } @else if (!_showSearchText) {
              @if (_placeholderTemplate) {
                <ng-container *ngTemplateOutlet="_placeholderTemplate" />
              } @else {
                {{ placeholderText() ?? '' }}
              }
            }

            <ng-content select="input" />
            <ng-content select="textarea" />
          </div>
        </div>

        @if (_inputState === 'closed') {
          <spk-icon suffix>caret-down</spk-icon>
        } @else if (_inputState === 'loading') {
          <spk-spinner class="primary" suffix></spk-spinner>
        } @else if (_inputState === 'open-searching') {
          <spk-icon suffix>list-magnifying-glass</spk-icon>
        } @else if (_inputState === 'searching') {
          <spk-icon suffix>magnifying-glass</spk-icon>
        } @else if (_inputState === 'selected' && _isClearable()) {
          <spk-icon suffix (click)="clear($event)">x-bold</spk-icon>
        } @else if (_inputState === 'selected' && !_isClearable()) {
          <spk-icon suffix>caret-down</spk-icon>
        } @else {
          <spk-icon suffix>caret-up</spk-icon>
        }
      </spk-form-field>

      <div class="sparkle-options" #optionsWrap>
        @for (option of filteredOptions(); track $index) {
          <li
            (click)="toggleOptionByIndex($index)"
            class="option"
            [class.selected]="isSelected($index)"
            [class.focused]="$index === focusedOptionIndex()">
            @if (selectMultiple()) {
              <spk-checkbox [class]="selectClasses()" [class.active]="isSelected($index)" />
            }

            @if (_listOptionTemplate) {
              <ng-container *ngTemplateOutlet="_listOptionTemplate; context: { $implicit: option }" />
            } @else {
              {{ getLabel(option) }}
            }
          </li>
        }
      </div>
    </spk-popover>
  `,
  host: {
    '[class.multiple]': 'selectMultiple()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSelectComponent {
  #selfRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);

  value = input<string>();
  label = input<string>();
  asFreeText = input(false);
  placeholder = input<string>();
  readonly = model(false);
  disabled = model(false);
  lazySearch = input(false);
  inlineSearch = input(false);
  asText = input(false);
  isClearable = input(true);
  selectMultiple = input(false);
  optionTemplate = input<TemplateRef<unknown> | null>(null);
  selectedOptionTemplate = input<TemplateRef<unknown> | null>(null);
  placeholderTemplate = input<TemplateRef<unknown> | null>(null);
  isOpen = model(false);
  isLoading = model(false);
  options = model<unknown[]>([]);
  selectedOptions = model<unknown[]>([]);
  cleared = output<void>();

  inlineTemplate = contentChild<TemplateRef<unknown>>(TemplateRef);
  optionsWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('optionsWrap');
  inputRefInput = signal<ElementRef<HTMLInputElement> | null>(null);
  #inputObserver =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      for (var mutation of mutations) {
        if (mutation && (mutation.target.nodeName === 'INPUT' || mutation.target.nodeName === 'TEXTAREA')) {
          this.inputRefInput.set(new ElementRef(mutation.target as HTMLInputElement));

          (this.#inputObserver as MutationObserver).disconnect();
        }
      }
    });

  inputValue = signal<string>('');

  prevInputValue = signal<string | null>(null);
  focusedOptionIndex = signal<number>(-1);

  _isClearable = computed(() => this.selectMultiple() || this.isClearable());
  selectClasses = computed(() => this.#selfRef.nativeElement.classList.toString());
  placeholderText = computed(() => {
    const placeholder = this.placeholder();
    const inputRefEl = this.inputRefEl();

    return placeholder || inputRefEl?.placeholder || null;
  });

  selectedOptionValues = computed(() => {
    const selectedOptions = this.selectedOptions();
    const valueKey = this.value();

    return valueKey
      ? selectedOptions.map((selectedOption) => this.#getProperty(selectedOption, valueKey))
      : selectedOptions;
  });

  filteredOptions = computed<unknown[]>(() => {
    const opts = this.options() || [];
    const label = this.label();
    const valueKey = this.value();
    const inlineSearch = this.inlineSearch();
    const inputValue = this.inputValue();
    const inputValueRegex = this.#createWildcardRegex(this.inputValue());

    if (opts.length <= 0) return [];
    if (!inlineSearch || inputValue === '') {
      return opts;
    }

    return opts.filter((item) => {
      const optionLabel = label
        ? (this.#getProperty(item, label) ?? '').toString().toLowerCase()
        : (item ?? '').toString().toLowerCase();

      const optionValue = ((valueKey ? this.#getProperty(item, valueKey) : item) ?? '').toString().toLowerCase();

      const testLabel = inputValueRegex.test(optionLabel);
      const testValue = inputValueRegex.test(optionValue);

      return testLabel || testValue;
    });
  });

  inputRefEl = computed(() => {
    const inputRefInput = this.inputRefInput();

    if (inputRefInput === null) return;

    const input = inputRefInput ? inputRefInput.nativeElement : null;

    if (!input) {
      console.warn(
        '<spk-select> input element not found are you missing to pass an <input> or <textarea> element to select component?'
      );
      return null;
    }

    input.autocomplete = 'off';

    this.#createCustomInputEventListener(input);

    input.addEventListener('focus', () => {
      if (this.readonly()) return;

      this.open();
    });

    if (this.hasSearch()) {
      input.addEventListener('input', (e: any) => {
        const newInputValue = e.target.value;
        const inputValue = this.inputValue();

        if (newInputValue === inputValue) return;

        this.focusedOptionIndex.set(this.asFreeText() ? -1 : 0);
        this.inputValue.set(newInputValue);
        this.updateInputElValue();
      });
    }

    input.addEventListener('inputValueChanged', (event: any) => {
      const newInputValue = event.detail.value;
      const inputValue = this.inputValue();

      if (newInputValue === inputValue) return;
      if (newInputValue === '') {
        this.clear();
        return;
      }

      this.setSelectedOptionsFromValue(newInputValue);
      this.setInputValueFromSelectedOptions();
      this.#setFirstSelectedOptionAsFocused();
    });

    return input;
  });

  openAbortController: AbortController | null = null;

  isOpenEffect = effect(() => {
    const isOpen = this.isOpen();

    if (isOpen) {
      if (!this.openAbortController) {
        this.openAbortController = new AbortController();
      }

      const input = this.inputRefEl();

      if (!input) return;

      (input as HTMLInputElement).addEventListener(
        'keydown',
        (e: KeyboardEvent) => {
          if (e.key === 'Escape' || e.key === 'Tab') {
            e.preventDefault();

            this.close();
          }

          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();

            this.toggleOptionByIndex(this.focusedOptionIndex());
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();

            const newIndex = (this.focusedOptionIndex() as number) + 1;

            this.focusedOptionIndex.set(newIndex > this.filteredOptions().length - 1 ? 0 : newIndex);
          }

          if (e.key === 'ArrowUp') {
            e.preventDefault();

            const newIndex = (this.focusedOptionIndex() as number) - 1;

            this.focusedOptionIndex.set(newIndex < 0 ? this.filteredOptions().length - 1 : newIndex);
          }
        },
        {
          signal: this.openAbortController?.signal,
        }
      );
    } else {
      const input = this.inputRefEl();

      if (!input) return;

      if (this.openAbortController) {
        this.openAbortController.abort();
        this.openAbortController = null;
      }
    }
  });

  _inputValue = '';
  inputValueEffect = effect(() => {
    const inputValue = this.inputValue();
    this._inputValue = inputValue;
  });

  inputRefElEffect = effect(() => {
    const input = this.inputRefEl();

    if (!input) return;
    if (input.value === this._inputValue) return;

    this.disabled.set(input.disabled);

    this.setSelectedOptionsFromValue(input.value);
    this.setInputValueFromSelectedOptions();
  });

  selectedLabels = computed(() => {
    const selected = this.selectedOptions();
    const label = this.label();

    if (!label) {
      return selected.join(', ');
    }

    return selected.map((selected) => this.getLabel(selected)).join(', ');
  });

  inputState = computed(() => {
    if ((this.selectedOptions().length > 0 || (this.asFreeText() && this.inputValue().length > 0)) && !this.isOpen()) {
      return 'selected';
    }

    if (this.isLoading()) {
      return 'loading';
    }

    if (this.isOpen() && (this.lazySearch() || this.inlineSearch())) {
      return 'open-searching';
    }

    if (this.isOpen()) {
      return 'open';
    }

    if (this.inlineSearch() || this.lazySearch()) {
      return 'searching';
    }

    return 'closed';
  });

  hasSearch = computed(() => this.inlineSearch() || this.lazySearch());

  #selectedOptionsEffect = effect(() => {
    if (this.selectMultiple() && this.hasSearch()) {
      return;
    }

    const selectedOptions = this.selectedOptions();
    const valueKey = this.value();

    const inputValue = selectedOptions
      .map((option) => {
        const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
        return optionValue;
      })
      .join(',');

    this.inputValue.set(inputValue);
  });

  ngOnInit() {
    this.setInitInput();
  }

  setInitInput() {
    const input = this.#selfRef.nativeElement.querySelector('input');

    if (input) {
      this.inputRefInput.set(new ElementRef(input));
      return;
    }

    const textarea = this.#selfRef.nativeElement.querySelector('textarea');

    if (textarea) {
      this.inputRefInput.set(new ElementRef(textarea as any as HTMLInputElement));
      return;
    }

    if (typeof MutationObserver !== 'undefined') {
      (this.#inputObserver as MutationObserver).observe(this.#selfRef.nativeElement, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  setSelectedOptionsFromValue(value: string) {
    const options = this.options() || [];
    const valueKey = this.value();
    const selectMultiple = this.selectMultiple();

    const inputValueAsString = value.toString().split(',');

    if (inputValueAsString.length === 0) {
      this.selectedOptions.set([]);
      return;
    }
    const inputAsArray = selectMultiple ? inputValueAsString : [inputValueAsString[0]];

    const selectedOptions = options.filter((option) => {
      const optionValue = valueKey ? this.#getProperty(option, valueKey)?.toString() : option?.toString();

      return optionValue && inputAsArray.includes(optionValue);
    });

    this.selectedOptions.set(selectMultiple ? selectedOptions : [selectedOptions[0]]);
  }

  setInputValueFromSelectedOptions() {
    const selectedOptions = this.selectedOptions();
    const valueKey = this.value();

    if (selectedOptions.length === 0) {
      this.inputValue.set('');
      this.updateInputElValue();
      return;
    }

    const inputValue = selectedOptions
      .map((option) => {
        const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
        return optionValue;
      })
      .join(',');

    this.inputValue.set(inputValue);
    this.updateInputElValue();
  }

  getLabel(option: unknown) {
    const label = this.label();

    if (!label) return option;

    return this.#getProperty(option, label);
  }

  toggleOptionByIndex(optionIndex: number, event?: MouseEvent) {
    const option = this.filteredOptions()[optionIndex];

    if ((this.asFreeText() && optionIndex === -1) || !option) {
      this.close();
      return;
    }

    if (event) {
      event.stopPropagation();
    }

    const selectMultiple = this.selectMultiple();
    const isClearable = this._isClearable();
    const valueKey = this.value();
    const selectedOptionValues = this.selectedOptionValues();
    const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;

    this.prevInputValue.set(null);
    this.selectedOptions.update((selectedOptions) => {
      const index = selectedOptionValues.indexOf(optionValue);

      if (index > -1) {
        // Remove it
        const nextSelectedOptions = [...selectedOptions.slice(0, index), ...selectedOptions.slice(index + 1)];

        return isClearable
          ? nextSelectedOptions
          : nextSelectedOptions.length > 0
            ? nextSelectedOptions
            : selectedOptions;
      } else {
        // Add it
        this.focusedOptionIndex.set(optionIndex);
        return selectMultiple ? [...selectedOptions, option] : [option];
      }
    });

    if (selectMultiple) {
      this.inputRefEl()?.focus();
    } else {
      this.isOpen.set(false);
    }

    this.setInputValueFromSelectedOptions();

    if (selectMultiple && this.hasSearch()) {
      this.inputValue.set('');
      this.updateInputElValue();
    }
  }

  removeSelectedOptionByIndex($event: MouseEvent, optionRemoveIndex: number) {
    $event.stopPropagation();

    this.selectedOptions.update((selectedOptions) => {
      return [...selectedOptions.slice(0, optionRemoveIndex), ...selectedOptions.slice(optionRemoveIndex + 1)];
    });

    this.setInputValueFromSelectedOptions();
  }

  isSelected(optionIndex: number): boolean {
    const valueKey = this.value();
    const option = this.filteredOptions()[optionIndex];
    const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;

    return this.selectedOptionValues().indexOf(optionValue) > -1;
  }

  open() {
    if (this.isOpen()) return;

    this.isOpen.set(true);

    if (this.hasSearch()) {
      this.prevInputValue.set(this.inputValue() ?? '');
      this.inputValue.set('');
      this.updateInputElValue();
    }

    if (!this.selectMultiple()) {
      this.#setFirstSelectedOptionAsFocused();
    }
  }

  #setFirstSelectedOptionAsFocused() {
    const firstSelectedValue = this.selectedOptionValues()[0];
    const valueKey = this.value();

    if (firstSelectedValue) {
      const findOptionIndex = this.filteredOptions().findIndex((x) =>
        valueKey ? this.#getProperty(x, valueKey) === firstSelectedValue : x === firstSelectedValue
      );

      this.focusedOptionIndex.set(findOptionIndex);
    } else {
      this.focusedOptionIndex.set(-1);
    }
  }

  close() {
    this.isOpen.set(false);

    const prevInputValue = this.prevInputValue();

    if (this.asFreeText()) {
      this.updateInputElValue();
      return;
    }

    if (this.hasSearch() && prevInputValue) {
      this.inputValue.set(prevInputValue);
      this.setInputValueFromSelectedOptions();
    }

    if (this.selectMultiple()) {
      this.setInputValueFromSelectedOptions();
    }
  }

  clear($event?: MouseEvent) {
    $event?.stopPropagation();

    this.inputValue.set('');
    this.selectedOptions.set([]);
    this.isOpen.set(false);
    this.prevInputValue.set(null);
    this.cleared.emit();

    this.updateInputElValue();
  }

  updateInputElValue() {
    const inputEl = this.inputRefEl();
    const inputValue = this.inputValue();

    if (!inputEl) return;

    inputEl.value = inputValue;
    inputEl.dispatchEvent(new Event('input'));
  }

  #getProperty(obj: unknown, path: string): unknown {
    return path.split('.').reduce((o: unknown, i: string) => (o as any)?.[i], obj);
  }

  #createCustomInputEventListener(input: HTMLInputElement | HTMLTextAreaElement) {
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
        return descriptor!.get!.call(this);
      },
      set(newVal) {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
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
  }

  #createWildcardRegex(inputValue: string | null | undefined): RegExp {
    const lowerCaseInput = (inputValue ?? '').toLowerCase();
    let regexPattern = '^';

    for (const char of lowerCaseInput) {
      regexPattern += '.*' + this.#escapeRegexChar(char);
    }

    regexPattern += '.*$';

    return new RegExp(regexPattern, 'i');
  }

  #escapeRegexChar(char: string): string {
    return char.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&');
  }

  ngOnDestroy() {
    if (this.openAbortController) {
      this.openAbortController.abort();
      this.openAbortController = null;
    }

    if (typeof MutationObserver !== 'undefined') {
      (this.#inputObserver as MutationObserver).disconnect();
    }
  }
}
