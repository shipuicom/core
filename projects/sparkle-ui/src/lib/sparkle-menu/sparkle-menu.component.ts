import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparklePopoverComponent } from '../sparkle-popover/sparkle-popover.component';
import { createInputSignal } from '../utilities/create-input-signal';

@Component({
  selector: 'spk-menu',
  imports: [SparklePopoverComponent, SparkleFormFieldComponent],
  template: `
    <spk-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close('fromPopover')"
      [above]="above()"
      [right]="right()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: true,
      }">
      <div trigger (click)="isOpen.set(true)">
        <ng-content />
      </div>

      <spk-form-field class="small" [class.hidden]="searchable() === false">
        <input type="text" #input placeholder="Search" />
      </spk-form-field>

      <div class="options" (click)="close('active')" [class.searching]="searchable() && inputValue() !== ''">
        <ng-content select="[menu]" />
      </div>
    </spk-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleMenuComponent {
  above = input<boolean>(false);
  right = input<boolean>(false);
  keepClickedOptionActive = input<boolean>(false);
  isOpen = model<boolean>(false);
  closed = output<boolean>();

  searchable = input<boolean>(false);
  activeOptionIndex = signal<number>(-1);
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  options = contentChildren<ElementRef<HTMLButtonElement>>('option', {
    descendants: true,
  });
  optionsEl = computed(() => {
    return Array.from(this.options())
      .map((x) => x.nativeElement)
      .filter((x) => !x.disabled);
  });

  inputValue = createInputSignal<string>(this.inputRef);

  abortController: AbortController | null = null;
  optionsEffect = effect(() => {
    if (!this.isOpen()) return;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.abortController = new AbortController();

    const inputEl = this.inputRef()?.nativeElement;

    if (!inputEl) return;

    queueMicrotask(() => inputEl.focus());

    inputEl.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        const optionElements = this.optionsEl();
        const activeOptionIndex = this.activeOptionIndex();

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.activeOptionIndex.set(this.nextActiveIndex(activeOptionIndex));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.activeOptionIndex.set(this.prevActiveIndex(activeOptionIndex));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeOptionIndex > -1) {
            optionElements[activeOptionIndex as number].click();

            queueMicrotask(() => this.close('active'));
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.close('closed');
        }
      },
      {
        signal: this.abortController.signal,
      }
    );
  });

  inputValueEffect = effect(() => {
    const searchable = this.searchable();

    if (!searchable) return;

    const inputValue = this.inputValue();
    const inputRegex = this.createWildcardRegex(inputValue);
    const optionElements = this.optionsEl();

    let firstFound = false;

    for (let index = 0; index < optionElements.length; index++) {
      const el = optionElements[index];

      if (!el.textContent) continue;
      if (!inputValue || inputValue === '') {
        el.classList.remove('hide-option');
        continue;
      }

      const testEl = inputRegex.test(el.textContent.toLowerCase());

      if (!testEl || el.disabled) {
        el.classList.add('hide-option');
      } else {
        el.classList.remove('hide-option');

        if (!firstFound) {
          queueMicrotask(() => this.activeOptionIndex.set(index));
        }

        firstFound = true;
      }
    }
  });

  activeOptionIndexEffect = effect(() => {
    const optionElements = this.optionsEl();
    const activeOptionIndex = this.activeOptionIndex();

    for (let index = 0; index < optionElements.length; index++) {
      optionElements[index].classList.remove('active');
    }

    if (activeOptionIndex > -1) {
      optionElements[activeOptionIndex].scrollIntoView({ block: 'center' });
      optionElements[activeOptionIndex].classList.add('active');
    }
  });

  nextActiveIndex(activeIndex: number): number {
    const optionElements = this.optionsEl();

    if (activeIndex === -1) {
      return 0;
    }

    if (activeIndex === optionElements.length - 1) {
      return 0;
    }

    const nextIndex = activeIndex + 1;

    if (this.searchable()) {
      if (optionElements[nextIndex].disabled) {
        return this.nextActiveIndex(nextIndex);
      }

      if (optionElements[nextIndex].classList.contains('hide-option')) {
        return this.nextActiveIndex(nextIndex);
      }
    }

    return nextIndex;
  }

  prevActiveIndex(activeIndex: number): number {
    const optionElements = this.optionsEl();

    if (activeIndex === 0) {
      return optionElements.length - 1;
    }

    if (activeIndex === -1) {
      return optionElements.length - 1;
    }

    const prevIndex = activeIndex - 1;

    if (this.searchable()) {
      if (optionElements[prevIndex].disabled) {
        return this.prevActiveIndex(prevIndex);
      }

      if (optionElements[prevIndex].classList.contains('hide-option')) {
        return this.prevActiveIndex(prevIndex);
      }
    }

    return prevIndex;
  }

  close(action: 'fromPopover' | 'closed' | 'active' = 'closed', event?: MouseEvent) {
    this.inputValue.set('');

    (!this.keepClickedOptionActive() || action === 'closed') && this.#resetActiveOption();

    this.isOpen.set(false);
    this.closed.emit(action === 'active');
  }

  #resetActiveOption() {
    this.activeOptionIndex.set(-1);

    const optionElements = this.optionsEl();

    for (let index = 0; index < optionElements.length; index++) {
      optionElements[index].classList.remove('active');
    }
  }

  ngOnDestroy() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  createWildcardRegex(inputValue: string | null | undefined): RegExp {
    const lowerCaseInput = (inputValue ?? '').toLowerCase();
    let regexPattern = '^';

    for (const char of lowerCaseInput) {
      regexPattern += '.*' + this.escapeRegexChar(char);
    }

    regexPattern += '.*$';

    return new RegExp(regexPattern, 'i');
  }

  escapeRegexChar(char: string): string {
    return char.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&');
  }
}
