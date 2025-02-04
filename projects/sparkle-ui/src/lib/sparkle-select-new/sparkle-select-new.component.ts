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
    SparkleSpinnerComponent,
  ],
  template: `
    @let _placeholderTemplate = placeholderTemplate();
    @let _optionTemplate = optionTemplate();
    @let _inlineTemplate = inlineTemplate();
    @let _selectOption = selectedOption();
    @let _showSearchText = (inlineSearch() || lazySearch()) && isOpen() && !isValid();
    @let _inputState = inputState();

    <spk-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close()"
      [markForCheck]="optionsSignal()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: false,
      }">
      <spk-form-field trigger (click)="open()" [class]="readonly() ? 'readonly' : ''">
        <ng-content select="label" ngProjectAs="label" />

        <div class="input" [class.show-search-text]="_showSearchText" ngProjectAs="input" #inputWrap>
          <ng-content select="input" />

          <div class="selected-value" [class.is-selected]="_inputState === 'selected'">
            @if (_selectOption) {
              @if (optionTemplate()) {
                <ng-container *ngTemplateOutlet="_optionTemplate; context: { $implicit: _selectOption }" />
              } @else if (_inlineTemplate) {
                <ng-container *ngTemplateOutlet="_inlineTemplate; context: { $implicit: _selectOption }" />
              } @else {
                {{ selectedLabel() }}
              }
            } @else {
              @if (_placeholderTemplate) {
                <ng-container *ngTemplateOutlet="_placeholderTemplate" />
              } @else {
                {{ placeholder() ?? '' }}
              }
            }
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
        } @else if (_inputState === 'selected' && isClearable()) {
          <spk-icon suffix (click)="clear($event)">backspace</spk-icon>
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
            [class.selected]="$index === selectedOptionIndex()"
            [class.focused]="$index === focusedOptionIndex()">
            @if (optionTemplate()) {
              <ng-container *ngTemplateOutlet="_optionTemplate; context: { $implicit: option }" />
            } @else if (_inlineTemplate) {
              <ng-container *ngTemplateOutlet="_inlineTemplate; context: { $implicit: option }" />
            } @else {
              {{ option }}
            }
          </li>
        }
      </div>
    </spk-popover>
  `,
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
  isClearable = input<boolean>(false);
  optionTemplate = input<TemplateRef<unknown> | null>(null);
  placeholderTemplate = input<TemplateRef<unknown> | null>(null);
  isValid = model<boolean>(false);
  selectedOption = model<unknown | null>(null);

  inlineTemplate = contentChild<TemplateRef<unknown>>(TemplateRef);
  inputWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrap');
  optionsWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('optionsWrap');

  #inputRef = signal<HTMLInputElement | null>(null);
  isOpen = signal(false);
  selectedOptionIndex = signal<number>(-1);
  focusedOptionIndex = signal<number>(-1);
  inputState = computed(() => {
    if (this.selectedValue() && !this.isOpen()) {
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

    // Check if the input value matches any option's value
    const isValid = options.some((option) => {
      const optionValue = valueKey ? this.#getProperty(option, valueKey) : option;
      return inputValue === optionValue?.toString();
    });

    this.isValid.set(isValid);
  });

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

  selectedLabel = computed(() => {
    const selected = this.selectedOption();
    const label = this.label();

    if (!label) {
      return selected;
    }

    return this.#getProperty(selected, label);
  });

  selectedLabelEffect = effect(() => {
    const selectedLabel = this.selectedLabel();
    const inputValue = this.inputValue();

    if (selectedLabel !== inputValue) {
      this.focusedOptionIndex.set(0);
    }
  });

  selectedValue = computed(() => {
    const selected = this.selectedOption();
    const valueKey = this.value();

    if (!valueKey || !selected) {
      return selected;
    }

    return this.#getProperty(selected, valueKey);
  });

  selectedOptionIndexEffect = effect(() => {
    const selectedValue = this.selectedValue();
    const options = this.#filteredOptions();

    this.selectedOptionIndex.set(options.indexOf(selectedValue));
  });

  selectedValueEffect = effect(() => {
    const selectedValue = this.selectedValue()?.toString();

    if (this.#inputRef()) {
      this.#inputRef()!.value = (selectedValue as string) ?? '';
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
        });

        if (typeof input.value === 'string') {
          this.inputValue.set(input.value);
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

    if (this.lazySearch() || this.inlineSearch()) {
      this.prevInputValue.set(this.inputValue());
    }

    this.inputValue.set('');

    if (this.#inputRef()) {
      this.#inputRef()!.value = '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
    }
  }

  selectOption(optionIndex: number) {
    const option = this.#filteredOptions()[optionIndex];

    if (this.isLoading() && this.lazySearch()) {
      return;
    }

    this.selectedOption.set(option);
    this.prevInputValue.set(null);
    this.isOpen.set(false);
  }

  close(action: 'fromPopover' | 'closed' | 'active' = 'closed') {
    this.isOpen.set(false);
    if ((this.lazySearch() || this.inlineSearch()) && this.prevInputValue()) {
      this.inputValue.set(this.prevInputValue()!);
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
    this.selectedOption.set(null);
    this.isOpen.set(false);
    this.prevInputValue.set(null);
  }

  #getProperty(obj: unknown, path: string): unknown {
    return path.split('.').reduce((o: unknown, i: string) => (o as any)?.[i], obj);
  }
}
