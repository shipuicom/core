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
import { ShipCheckboxComponent } from '../ship-checkbox/ship-checkbox.component';
import { ShipChipComponent } from '../ship-chip/ship-chip.component';
import { ShipDividerComponent } from '../ship-divider/ship-divider.component';
import { ShipFormFieldComponent } from '../ship-form-field/ship-form-field.component';
import { ShipIcon } from '../ship-icon/ship-icon';
import { ShipPopoverComponent } from '../ship-popover/ship-popover.component';
import { ShipSpinnerComponent } from '../ship-spinner/ship-spinner.component';
import { generateUniqueId } from '../utilities/random-id';

// TODO build in live validation response for free text validation

type ValidateFreeText = (value: string) => boolean;

@Component({
  selector: 'sh-select',
  imports: [
    NgTemplateOutlet,
    ShipPopoverComponent,
    ShipFormFieldComponent,
    ShipIcon,
    ShipCheckboxComponent,
    ShipSpinnerComponent,
    ShipChipComponent,
    ShipDividerComponent,
  ],
  template: `
    @let _placeholderTemplate = placeholderTemplate();
    @let _optionTemplate = optionTemplate();
    @let _freeTextOptionTemplate = freeTextOptionTemplate();
    @let _selectedOptionTemplate = selectedOptionTemplate();
    @let _inlineTemplate = inlineTemplate();
    @let _selectedOptions = selectedOptions();
    @let _inputState = inputState();

    @let _selOptionTemplate = _selectedOptionTemplate || _optionTemplate || _inlineTemplate;
    @let _listOptionTemplate = _optionTemplate || _inlineTemplate;
    @let _asChips = !asText() && selectMultiple();
    @let _showSearchText = isOpen() && hasSearch() && (_asChips || inputValue().length > -1);

    <sh-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: false,
      }">
      <sh-form-field
        trigger
        (click)="open()"
        [class.stretch]="stretch()"
        [class.small]="small()"
        [class.readonly]="readonly() || disabled()">
        <ng-content select="label" ngProjectAs="label" />
        <ng-content select="[prefix]" ngProjectAs="[prefix]" />
        <ng-content select="[boxPrefix]" ngProjectAs="[boxPrefix]" />

        <div class="input" [class.show-search-text]="_showSearchText" ngProjectAs="input">
          <div class="selected-value" [class.is-selected]="_inputState === 'selected'">
            @if (asFreeText() && inputValue().length > 0 && !isOpen()) {
              {{ inputValue() }}
            } @else if (_selectedOptions.length > 0) {
              @for (selectedOption of _selectedOptions; track $index) {
                @if (selectedOption) {
                  @if (_asChips) {
                    <sh-chip
                      [class]="selectClasses()"
                      class="small"
                      (click)="removeSelectedOptionByIndex($event, $index)">
                      @if (_selOptionTemplate) {
                        <ng-container
                          *ngTemplateOutlet="_selOptionTemplate; context: { $implicit: selectedOption, last: $last }" />
                      } @else {
                        {{ getLabel(selectedOption) }}
                      }

                      <sh-icon>x-bold</sh-icon>
                    </sh-chip>
                  } @else {
                    @if (!_showSearchText) {
                      @if (_selOptionTemplate) {
                        <ng-container
                          *ngTemplateOutlet="_selOptionTemplate; context: { $implicit: selectedOption, last: $last }" />
                      } @else {
                        {{ $last ? getLabel(selectedOption) : getLabel(selectedOption) + ',' }}
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
          <sh-icon suffix>caret-down</sh-icon>
        } @else if (_inputState === 'loading') {
          <sh-spinner class="primary" suffix></sh-spinner>
        } @else if (_inputState === 'open-searching') {
          <sh-icon suffix>list-magnifying-glass</sh-icon>
        } @else if (_inputState === 'searching') {
          <sh-icon suffix>magnifying-glass</sh-icon>
        } @else if (_inputState === 'selected' && _isClearable()) {
          <sh-icon suffix (click)="clear($event)">x-bold</sh-icon>
        } @else if (_inputState === 'selected' && !_isClearable()) {
          <sh-icon suffix>caret-down</sh-icon>
        } @else {
          <sh-icon suffix>caret-up</sh-icon>
        }
      </sh-form-field>

      <div class="ship-options" #optionsWrap id="optionsWrapId" role="listbox">
        @if (asFreeText()) {
          @let freeTextOption = computedFreeTextOption();
          @let freeTextOptionValue = getValue(freeTextOption);

          @if ($any(freeTextOptionValue).length > 0) {
            @if (freeTextTitle()) {
              <p title>{{ freeTextTitle() }}</p>
            }

            <li
              (click)="toggleOptionByIndex(-1)"
              class="option"
              [id]="this.getLabelAsSlug(freeTextOption)"
              [attr.aria-selected]="isSelected(-1)"
              [class.selected]="isSelected(-1)"
              [class.focused]="-1 === focusedOptionIndex()">
              @if (_freeTextOptionTemplate) {
                <ng-container *ngTemplateOutlet="_freeTextOptionTemplate; context: { $implicit: freeTextOption }" />
              } @else if (_listOptionTemplate) {
                <ng-container *ngTemplateOutlet="_listOptionTemplate; context: { $implicit: freeTextOption }" />
              } @else {
                {{ freeTextOptionValue }}
              }
            </li>

            @if (freeTextTitle() && filteredOptions().length > 0) {
              <sh-divider />
            }
          }
        }

        @if (optionTitle() && filteredOptions().length > 0) {
          <p title>{{ optionTitle() }}</p>
        }

        @for (option of filteredOptions(); track $index) {
          <li
            (click)="toggleOptionByIndex($index)"
            class="option"
            [id]="this.getLabelAsSlug(option)"
            [attr.aria-selected]="isSelected($index)"
            [class.selected]="isSelected($index)"
            [class.focused]="$index === focusedOptionIndex()">
            @if (selectMultiple()) {
              <sh-checkbox [class]="selectClasses()" [class.active]="isSelected($index)" />
            }

            @if (_listOptionTemplate) {
              <ng-container *ngTemplateOutlet="_listOptionTemplate; context: { $implicit: option }" />
            } @else {
              {{ getLabel(option) }}
            }
          </li>
        }
      </div>
    </sh-popover>
  `,
  host: {
    '[class.multiple]': 'selectMultiple()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipSelectComponent {
  #selfRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);

  value = input<string>();
  label = input<string>();
  asFreeText = input(false);
  optionTitle = input<string | null>(null);
  freeTextTitle = input<string | null>(null);
  freeTextPlaceholder = input<string | null>('Type to create a new option');
  validateFreeText = input<ValidateFreeText>();
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
  freeTextOptionTemplate = input<TemplateRef<unknown> | null>(null);
  isOpen = model(false);
  isLoading = model(false);
  options = model<unknown[]>([]);
  selectedOptions = model<unknown[]>([]);
  cleared = output<void>();
  onAddNewFreeTextOption = output<string>();

  computedFreeTextOption = computed(() => {
    const inputValue = this.inputValue();
    const valueKey = this.value();
    const newOption: Record<string, any> | string = valueKey ? {} : inputValue;

    if (valueKey && typeof newOption === 'object') {
      newOption[valueKey] = inputValue;
    }

    return newOption;
  });

  #previousSelectedOptions = signal<unknown[] | null>(null);
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
  stretch = computed(() => this.selectClasses().includes('stretch'));
  small = computed(() => this.selectClasses().includes('small'));
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
    const inputValue = this.inputValue().toLowerCase();
    const inputValueRegex = this.#createWildcardRegex(inputValue);

    if (opts.length <= 0) return [];
    if (!inlineSearch || inputValue === '') {
      return opts;
    }

    const filtered = opts.filter((item) => {
      const optionLabel = label
        ? (this.#getProperty(item, label) ?? '').toString().toLowerCase()
        : (item ?? '').toString().toLowerCase();

      const optionValue = ((valueKey ? this.#getProperty(item, valueKey) : item) ?? '').toString().toLowerCase();

      const testLabel = inputValueRegex.test(optionLabel);
      const testValue = inputValueRegex.test(optionValue);

      return testLabel || testValue;
    });

    const scoredOptions = filtered.map((item) => {
      const optionLabel = label
        ? (this.#getProperty(item, label) ?? '').toString().toLowerCase()
        : (item ?? '').toString().toLowerCase();

      const optionValue = ((valueKey ? this.#getProperty(item, valueKey) : item) ?? '').toString().toLowerCase();

      const labelScore = this.#calculateMatchScore(optionLabel, inputValue);
      const valueScore = this.#calculateMatchScore(optionValue, inputValue);

      return {
        item,
        score: Math.max(labelScore, valueScore),
      };
    });

    scoredOptions.sort((a, b) => b.score - a.score);

    return scoredOptions.map((scoredOption) => scoredOption.item);
  });

  #calculateMatchScore(option: string, input: string): number {
    if (!input) return 0;

    let score = 0;
    let lastIndex = -1;
    let matchCount = 0;
    let inSequence = true;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (option.length > lastIndex + 1 && option[lastIndex + 1] === char) {
        score += i === 0 ? 100 : 150;
        lastIndex++;
        matchCount++;
      } else {
        const charIndex = option.indexOf(char, lastIndex + 1);

        if (i > 0) {
          inSequence = false;
        }

        if (charIndex === -1) {
          return 0;
        }

        score += 100;

        lastIndex = charIndex;
        matchCount++;
      }
    }

    if (inSequence && input.length === matchCount) {
      score += 1000;
    }

    score += matchCount * 20;

    return score;
  }

  #componentId = generateUniqueId();
  inputRefEl = computed(() => {
    const inputRefInput = this.inputRefInput();

    if (inputRefInput === null) return;

    const input = inputRefInput ? inputRefInput.nativeElement : null;

    if (!input) {
      console.warn(
        '<sh-select> input element not found are you missing to pass an <input> or <textarea> element to select component?'
      );
      return null;
    }

    input.autocomplete = 'off';
    input.setAttribute('role', 'combobox');
    input.setAttribute('id', `combobox-${this.#componentId}`);
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-owns', 'optionsWrapId');

    this.#createCustomInputEventListener(input);

    input.addEventListener('focus', () => {
      if (this.readonly()) return;

      this.open();
    });

    input.addEventListener('input', (e: any) => {
      const newInputValue = e.target.value;
      const inputValue = this.inputValue();

      if (newInputValue === inputValue) return;

      this.focusedOptionIndex.set(this.asFreeText() ? -1 : 0);
      this.inputValue.set(newInputValue);
      this.updateInputElValue();
    });

    input.addEventListener('inputValueChanged', (event: any) => {
      const newInputValue = event.detail.value;
      const inputValue = this.inputValue();

      if (newInputValue === inputValue) return;
      if (newInputValue === '') {
        this.clear();
        return;
      }

      this.setSelectedOptionsFromValue(newInputValue);
      this.setInputValueFromOptions(this.selectedOptions());
      this.#setFirstSelectedOptionAsFocused();
    });

    return input;
  });

  focusEffect = effect(() => {
    const input = this.inputRefEl();

    if (!input) return;

    const focusedId = this.getLabelAsSlug(this.filteredOptions()[this.focusedOptionIndex()]);

    if (focusedId) {
      input.setAttribute('aria-activedescendant', focusedId);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  });

  openAbortController: AbortController | null = null;

  isOpenEffect = effect(() => {
    const isOpen = this.isOpen();

    if (isOpen) {
      if (!this.openAbortController) {
        this.openAbortController = new AbortController();
      }

      const input = this.inputRefEl();
      const asFreeText = this.asFreeText();
      const baseIndex = asFreeText ? -1 : 0;

      if (!input) return;

      input.setAttribute('aria-expanded', this.isOpen().toString());

      (input as HTMLInputElement).addEventListener(
        'keydown',
        (e: KeyboardEvent) => {
          if (e.key === 'Escape' || e.key === 'Tab') {
            e.preventDefault();

            this.close();
          }

          if (e.key === 'Enter') {
            e.preventDefault();

            this.toggleOptionByIndex(this.focusedOptionIndex(), undefined, true);
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();

            const newIndex = (this.focusedOptionIndex() as number) + 1;

            this.focusedOptionIndex.set(newIndex > this.filteredOptions().length - 1 ? baseIndex : newIndex);
          }

          if (e.key === 'ArrowUp') {
            e.preventDefault();

            const newIndex = (this.focusedOptionIndex() as number) - 1;

            this.focusedOptionIndex.set(newIndex < baseIndex ? this.filteredOptions().length - 1 : newIndex);
          }
        },
        {
          signal: this.openAbortController?.signal,
        }
      );
    } else {
      const input = this.inputRefEl();

      if (!input) return;

      input.setAttribute('aria-expanded', this.isOpen().toString());

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
    this.setInputValueFromOptions(this.selectedOptions());
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

  setInputValueFromOptions(options: unknown[]) {
    const valueKey = this.value();

    if (options.length === 0) {
      this.inputValue.set('');
      this.updateInputElValue();

      return;
    }

    const newInputValue = options
      .map((option) => {
        const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
        return optionValue;
      })
      .join(',');

    if (newInputValue === this.inputValue()) return;

    this.inputValue.set(newInputValue);
    this.updateInputElValue();
  }

  getValue(option: unknown) {
    const valueKey = this.value();

    if (!valueKey) return option;

    return this.#getProperty(option, valueKey);
  }

  getLabel(option: unknown) {
    const label = this.label();

    if (!label) return option;

    return this.#getProperty(option, label);
  }

  getLabelAsSlug(option: unknown) {
    const label = this.getLabel(option);

    if (!label || typeof label !== 'string') return '';

    return label.replaceAll(' ', '-');
  }

  toggleOptionByIndex(optionIndex: number, event?: MouseEvent, enterKey = false) {
    let option = this.filteredOptions()[optionIndex];

    if (this.asFreeText() && optionIndex === -1) {
      const newOption = this.computedFreeTextOption();
      const newOptionValue = this.getValue(newOption);
      const validateFreeTextFunc = this.validateFreeText() ?? ((val: string) => true);

      const isValid = validateFreeTextFunc(newOptionValue as string);

      if (!isValid) return;

      this.options.update((options) => {
        const index = options.findIndex((option) => this.getValue(option) === newOptionValue);

        if (index > -1) return options;

        this.onAddNewFreeTextOption.emit(newOptionValue as string);

        return [newOption, ...options];
      });

      optionIndex = 0;
      option = newOption;
    } else if (!option) {
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
    this.#previousSelectedOptions.set(null);
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

    this.setInputValueFromOptions(this.selectedOptions());

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

    this.setInputValueFromOptions(this.selectedOptions());
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
    } else {
      this.#previousSelectedOptions.set(this.selectedOptions());
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
    const prevSelectedOptions = this.#previousSelectedOptions();

    if (this.asFreeText()) {
      this.updateInputElValue();
      return;
    }

    if (this.hasSearch() && prevInputValue) {
      this.inputValue.set(prevInputValue);
      this.setInputValueFromOptions(this.selectedOptions());
    }

    if (!this.hasSearch() && prevSelectedOptions !== null) {
      this.setInputValueFromOptions(prevSelectedOptions);
    }

    if (this.selectMultiple()) {
      this.setInputValueFromOptions(this.selectedOptions());
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
