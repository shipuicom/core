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
  selector: 'spk-select-new',
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
    @let _showSearchText = (inlineSearch() || lazySearch()) && isOpen() && !isValid();
    @let _inputState = inputState();

    @let _selOptionTemplate = _selectedOptionTemplate || _optionTemplate || _inlineTemplate;
    @let _listOptionTemplate = _optionTemplate || _inlineTemplate;
    @let _asChips = !asText() && selectMultiple();

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
        [class]="readonly() ? 'readonly' : ''">
        <ng-content select="label" ngProjectAs="label" />

        <div class="input" [class.show-search-text]="_showSearchText" ngProjectAs="input" #inputWrap>
          <div class="selected-value" [class.is-selected]="_inputState === 'selected'">
            @if (_selectedOptions.length > 0) {
              @if (_selOptionTemplate) {
                @for (selectedOption of _selectedOptions; track $index; let last = $last) {
                  @if (_asChips) {
                    <spk-chip [class]="selectClasses()" class="small">
                      <ng-container *ngTemplateOutlet="_selOptionTemplate; context: { $implicit: selectedOption }" />

                      <spk-icon (click)="removeSelectedOptionByIndex($event, $index)">x-bold</spk-icon>
                    </spk-chip>
                  } @else {
                    <ng-container *ngTemplateOutlet="_selOptionTemplate; context: { $implicit: selectedOption }" />
                  }
                }
              } @else {
                @if (_asChips) {
                  @for (selectedOption of _selectedOptions; track $index; let last = $last) {
                    <spk-chip [class]="selectClasses()" class="small">
                      {{ getLabel(selectedOption) }}

                      <spk-icon (click)="removeSelectedOptionByIndex($event, $index)">x-bold</spk-icon>
                    </spk-chip>
                  }
                } @else {
                  {{ selectedLabels() }}
                }
              }
            } @else {
              @if (_placeholderTemplate) {
                <ng-container *ngTemplateOutlet="_placeholderTemplate" />
              } @else {
                {{ placeholder() ?? '' }}
              }
            }
          </div>

          <ng-content select="input" />
        </div>

        @if (_inputState === 'closed') {
          <spk-icon suffix>caret-down</spk-icon>
        } @else if (_inputState === 'loading') {
          <spk-spinner class="primary" suffix></spk-spinner>
        } @else if (_inputState === 'open-searching') {
          <spk-icon suffix>list-magnifying-glass</spk-icon>
        } @else if (_inputState === 'searching') {
          <spk-icon suffix>magnifying-glass</spk-icon>
        } @else if (_inputState === 'selected' && isClearable()) {
          <spk-icon suffix (click)="clear($event)">x-bold</spk-icon>
        } @else if (_inputState === 'selected' && !isClearable()) {
          <spk-icon suffix>check</spk-icon>
        } @else {
          <spk-icon suffix>caret-up</spk-icon>
        }
      </spk-form-field>

      <div class="sparkle-options" #optionsWrap>
        @for (option of optionsSignal(); track $index) {
          <li
            (click)="selectOption($index)"
            class="option"
            [class.selected]="isSelected($index)"
            [class.focused]="$index === focusedOptionIndex()">
            @if (selectMultiple()) {
              <spk-checkbox [class]="selectClasses()" [class.active]="isSelected($index)" />
            }

            @if (_listOptionTemplate) {
              <ng-container *ngTemplateOutlet="_listOptionTemplate; context: { $implicit: option }" />
            } @else {
              {{ option }}
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
export class SparkleSelectNewComponent {
  #selfRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);

  debugRef = input<number | null>(null);
  options = input<unknown[]>([]);
  label = input<string>();
  value = input<string>();
  placeholder = input<string>();
  inlineSearch = input<boolean>(false);
  lazySearch = input<boolean>(false);
  readonly = input<boolean>(false);
  isLoading = input<boolean>(false);
  isClearable = input<boolean>(true);
  asText = input<boolean>(false);
  selectMultiple = input<boolean>(false);
  optionTemplate = input<TemplateRef<unknown> | null>(null);
  selectedOptionTemplate = input<TemplateRef<unknown> | null>(null);
  placeholderTemplate = input<TemplateRef<unknown> | null>(null);
  isValid = model<boolean>(false);
  selectedOptions = model<unknown[]>([]);

  inlineTemplate = contentChild<TemplateRef<unknown>>(TemplateRef);
  inputWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrap');
  optionsWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('optionsWrap');

  #inputRef = signal<HTMLInputElement | null>(null);
  isOpen = signal(false);
  selectedOptionIndices = signal<number[]>([]);
  focusedOptionIndex = signal<number>(-1);
  inputState = computed(() => {
    if (this.selectedValues().length > 0 && !this.isOpen()) {
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

  prevInputValue = signal<string | null>(null);
  inputValue = signal<string>('');

  inputValidityEffect = effect(() => {
    const inputValue = this.inputValue();
    const options = this.options();
    const valueKey = this.value();
    const selectMultiple = this.selectMultiple();

    if (selectMultiple) {
      const inputValues = inputValue
        .split(',')
        .map((val) => val.trim())
        .filter((x) => x !== '');

      const isValid = inputValues.every((inputValue) => {
        return options.some((option) => {
          const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
          return inputValue === optionValue?.toString();
        });
      });

      this.isValid.set(isValid);
    } else {
      const isValid = options.some((option) => {
        const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
        return inputValue === optionValue?.toString();
      });

      this.isValid.set(isValid);
    }
  });

  selectClasses = computed(() => this.#selfRef.nativeElement.classList.toString());

  #readonlyEffect = effect(() => {
    const input = this.#inputRef();

    if (input) {
      input.disabled = this.readonly();
    }
  });

  #filteredOptions = computed<unknown[]>(() => {
    const opts = this.options();
    const label = this.label();
    const inlineSearch = this.inlineSearch();
    const inputValue = this.inputValue().toLowerCase();

    if (opts.length <= 0) return [];

    if (!inlineSearch) {
      return opts;
    }

    if (label) {
      return opts.filter((item) => {
        const optionValue = (this.#getProperty(item, label) ?? '').toString().toLowerCase();
        return optionValue.includes(inputValue);
      });
    } else {
      return opts.filter((item) => {
        const optionValue = (item ?? '').toString().toLowerCase();
        return optionValue.includes(inputValue);
      });
    }
  });

  optionsSignal = computed(() => {
    const opts = this.#filteredOptions();
    const label = this.label();

    let result = opts;

    if (label) {
      result = opts.map((item) => this.#getProperty(item, label));
    }

    return result;
  });

  selectedLabels = computed(() => {
    const selected = this.selectedOptions();
    const label = this.label();

    if (!label) {
      return selected.join(', ');
    }

    return selected.map((selected) => this.getLabel(selected)).join(', ');
  });

  getLabel(option: unknown) {
    const label = this.label();

    if (!label) return option;

    return this.#getProperty(option, label);
  }

  selectedValues = computed(() => {
    const selected = this.selectedOptions();
    const valueKey = this.value();

    if (!valueKey || selected.length === 0) {
      return selected;
    }

    return selected.map((selected) => this.#getProperty(selected, valueKey));
  });

  selectedOptionIndicesEffect = effect(() => {
    const selectedValues = this.selectedValues();
    const options = this.#filteredOptions();
    const valueKey = this.value();

    if (this.selectMultiple()) {
      this.selectedOptionIndices.set(
        selectedValues.map((selectedValue) =>
          options.findIndex((option) => {
            const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
            return optionValue === selectedValue;
          })
        )
      );
    } else {
      const selectedValue = selectedValues[0];
      const index = options.findIndex((option) => {
        const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
        return optionValue === selectedValue;
      });
      this.selectedOptionIndices.set(index > -1 ? [index] : []);
    }
  });

  selectedValueEffect = effect(() => {
    const selectedValues = this.selectedValues();

    if (this.#inputRef()) {
      if (this.selectMultiple()) {
        this.#inputRef()!.value = selectedValues.join(',');
      } else {
        this.#inputRef()!.value = selectedValues[0]?.toString() ?? '';
      }

      this.#inputRef()!.dispatchEvent(new Event('input'));
    }
  });

  #inputObserver =
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver((mutations) => {
      for (var _ of mutations) {
        const input = this.#selfRef.nativeElement.querySelector('input');

        if (!input) return;

        input.autocomplete = 'off';
        input.addEventListener('input', () => {
          this.inputValue.set(input.value);
        });

        input.addEventListener('focus', () => {
          if (this.readonly()) return;
          this.open();
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' || e.key === 'Tab') {
            this.close();
          }

          if (e.key === 'Enter') {
            this.selectOption(this.focusedOptionIndex());
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = (this.focusedOptionIndex() as number) + 1;

            this.focusedOptionIndex.set(newIndex > this.optionsSignal().length - 1 ? 0 : newIndex);
            this.#scrollToFocusedOption();
          }

          if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = (this.focusedOptionIndex() as number) - 1;

            this.focusedOptionIndex.set(newIndex < 0 ? this.optionsSignal().length - 1 : newIndex);
            this.#scrollToFocusedOption();
          }

          if (!(this.lazySearch() || this.inlineSearch())) {
            e.preventDefault();
            return;
          }
        });

        if (typeof input.value === 'string') {
          if (this.selectMultiple()) {
            this.selectOptionsByValue(input.value);
          } else {
            this.selectOptionByValue(input.value);
          }
        }

        this.#inputRef.set(input);

        (this.#inputObserver as MutationObserver).disconnect();
        return;
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

  #scrollToFocusedOption() {
    setTimeout(() => {
      const findElementWithClassFocused = this.optionsWrapRef().nativeElement.querySelector('.focused');
      findElementWithClassFocused?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  open() {
    this.isOpen.set(true);

    if (!this.selectMultiple()) {
      const selectedIndex = this.selectedOptionIndices()[0];
      this.focusedOptionIndex.set(selectedIndex !== undefined ? selectedIndex : 0);
      this.#scrollToFocusedOption();
    }

    if (this.lazySearch() || this.inlineSearch()) {
      this.prevInputValue.set(this.inputValue());
      this.focusedOptionIndex.set(0);
      this.inputValue.set('');

      if (this.#inputRef()) {
        this.#inputRef()!.value = '';
        this.#inputRef()!.dispatchEvent(new Event('input'));
      }
    }
  }

  selectOption(optionIndex: number) {
    const option = this.#filteredOptions()[optionIndex];

    if (this.isLoading() && this.lazySearch()) {
      return;
    }

    this.prevInputValue.set(null);
    this.focusedOptionIndex.set(optionIndex);

    if (this.selectMultiple()) {
      const currentIndices = this.selectedOptionIndices();
      const index = currentIndices.indexOf(optionIndex);
      if (index > -1) {
        currentIndices.splice(index, 1);
        this.selectedOptionIndices.set([...currentIndices]);
        this.selectedOptions.set(currentIndices.map((i) => this.#filteredOptions()[i]));
      } else {
        this.selectedOptionIndices.set([...currentIndices, optionIndex]);
        this.selectedOptions.set([...this.selectedOptions(), option]);
      }
    } else {
      this.selectedOptions.set([option]);
      this.isOpen.set(false);
    }
  }

  removeSelectedOptionByIndex($event: MouseEvent, optionIndex: number) {
    $event.stopPropagation();

    this.selectedOptions.set(this.selectedOptions().filter((_, i) => i !== optionIndex));
    this.selectedOptionIndices.set(this.selectedOptionIndices().filter((_, i) => i !== optionIndex));
  }

  isSelected(optionIndex: number): boolean {
    return this.selectedOptionIndices().includes(optionIndex);
  }

  selectOptionByValue(value: string) {
    const valueKey = this.value();
    const optionIndex = this.options().findIndex((x) =>
      valueKey ? this.#getProperty(x, valueKey)?.toString() === value : x?.toString() === value
    );

    if (optionIndex > -1) {
      this.selectOption(optionIndex);
    }
  }

  selectOptionsByValue(values: string) {
    const valueKey = this.value();
    const valueArray = values
      .split(',')
      .map((v) => v.trim())
      .filter((x) => x !== '');

    valueArray.forEach((value) => {
      const optionIndex = this.options().findIndex((x) =>
        valueKey ? this.#getProperty(x, valueKey)?.toString() === value : x?.toString() === value
      );

      if (optionIndex > -1) {
        this.selectOption(optionIndex);
      }
    });
  }

  close() {
    this.isOpen.set(false);

    const prevInputValue = this.prevInputValue();

    if ((this.lazySearch() || this.inlineSearch()) && prevInputValue !== null && prevInputValue !== undefined) {
      if (this.selectMultiple()) {
        this.selectOptionsByValue(prevInputValue!);
      } else {
        this.selectOptionByValue(prevInputValue!);
      }
    }
  }

  ngOnDestroy() {
    if (typeof MutationObserver !== 'undefined') {
      (this.#inputObserver as MutationObserver).disconnect();
    }
  }

  clear($event?: MouseEvent) {
    $event?.stopPropagation();

    this.inputValue.set('');
    this.selectedOptions.set([]);
    this.isOpen.set(false);
    this.prevInputValue.set(null);
  }

  #getProperty(obj: unknown, path: string): unknown {
    return path.split('.').reduce((o: unknown, i: string) => (o as any)?.[i], obj);
  }
}
