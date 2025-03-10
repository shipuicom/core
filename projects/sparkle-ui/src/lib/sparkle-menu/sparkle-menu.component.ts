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
  closeOnClick = input<boolean>(true);
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
    const optionElements = this.optionsEl();

    this.activeElements.set(optionElements);

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

  activeElements = signal<HTMLButtonElement[]>([]);
  inputValueEffect = effect(() => {
    const searchable = this.searchable();

    if (!searchable) return;

    const optionElements = this.optionsEl();
    const inputValue = (this.inputValue() ?? '').toLowerCase();

    this.#resetActiveOption();

    if (!inputValue || inputValue === '') {
      for (let index = 0; index < optionElements.length; index++) {
        const el = optionElements[index];
        el.classList.remove('hide-option');
        el.dataset['score'] = undefined;
        el.style.order = '';
      }
      return;
    }

    let _scoredOptions = [];
    let scores = [];

    for (let index = 0; index < optionElements.length; index++) {
      const el = optionElements[index];
      const textContent = el.textContent?.toLowerCase() || '';
      const score = this.#calculateMatchScore(textContent, inputValue);

      if (score === 0 || el.disabled) {
        el.classList.add('hide-option');
        el.style.order = '';
        continue;
      }

      el.classList.remove('hide-option');

      let inserted = false;
      for (let i = 0; i < scores.length; i++) {
        if (score > scores[i]) {
          _scoredOptions.splice(i, 0, el);
          scores.splice(i, 0, score);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        _scoredOptions.push(el);
        scores.push(score);
      }
    }

    for (let index = 0; index < _scoredOptions.length; index++) {
      _scoredOptions[index].style.order = index.toString();
    }

    this.activeElements.set(_scoredOptions);
  });

  #calculateMatchScore(option: string, input: string): number {
    if (!input) return 0;

    let score = 0;
    let lastIndex = -1;
    let matchCount = 0;

    if (option.includes(input)) {
      score += 1000;
    }

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const charIndex = option.indexOf(char, lastIndex + 1);

      if (charIndex === -1) {
        return 0;
      }

      score += 100;

      if (lastIndex + 1 === charIndex && lastIndex !== -1) {
        score += 50;
      }

      lastIndex = charIndex;
      matchCount++;
    }

    score += matchCount * 20;

    return score;
  }

  activeOptionIndexEffect = effect(() => {
    const optionElements = this.activeElements();
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
    const optionElements = this.activeElements();

    if (activeIndex === -1) {
      return 0;
    }

    if (activeIndex === optionElements.length - 1) {
      return 0;
    }

    const nextIndex = activeIndex + 1;

    if (optionElements[nextIndex].disabled) {
      return this.nextActiveIndex(nextIndex);
    }

    return nextIndex;
  }

  prevActiveIndex(activeIndex: number): number {
    const optionElements = this.activeElements();

    if (activeIndex === 0) {
      return optionElements.length - 1;
    }

    if (activeIndex === -1) {
      return optionElements.length - 1;
    }

    const prevIndex = activeIndex - 1;

    if (optionElements[prevIndex].disabled) {
      return this.prevActiveIndex(prevIndex);
    }

    return prevIndex;
  }

  close(action: 'fromPopover' | 'closed' | 'active' = 'closed', event?: MouseEvent) {
    this.inputValue.set('');

    if (this.closeOnClick()) {
      (!this.keepClickedOptionActive() || action === 'closed') && this.#resetActiveOption();

      this.isOpen.set(false);
      this.closed.emit(action === 'active');
    }
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
