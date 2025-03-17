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
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparklePopoverComponent } from '../sparkle-popover/sparkle-popover.component';
import { createInputSignal } from '../utilities/create-input-signal';
import { observeChildren } from '../utilities/observe-elements';

@Component({
  selector: 'spk-menu',
  imports: [SparklePopoverComponent, SparkleFormFieldComponent, SparkleIconComponent],
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
      <div trigger [class.is-open]="isOpen()" (click)="isOpen.set(true)">
        <ng-content />

        @if (openIndicator()) {
          <spk-icon>caret-down</spk-icon>
        }
      </div>

      <spk-form-field class="small" [class.hidden]="searchable() === false">
        <input type="text" #input placeholder="Search" />
      </spk-form-field>

      <div
        class="options"
        #optionsRef
        (click)="close('active')"
        [class.searching]="searchable() && inputValue() !== ''">
        <ng-content select="[menu]" />
      </div>
    </spk-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleMenuComponent {
  #renderer = inject(Renderer2);
  above = input<boolean>(false);
  right = input<boolean>(false);
  openIndicator = input(true);
  customOptionElementSelectors = input<string[]>(['button']);
  keepClickedOptionActive = input<boolean>(false);
  closeOnClick = input<boolean>(true);
  isOpen = model<boolean>(false);
  closed = output<boolean>();

  searchable = input<boolean>(false);
  activeOptionIndex = signal<number>(-1);
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  optionsRef = viewChild<ElementRef<HTMLDivElement>>('optionsRef');

  options = observeChildren<HTMLButtonElement>(this.optionsRef, this.customOptionElementSelectors);
  optionsEl = computed(() => this.options.signal().filter((x) => !x.disabled));

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

    if (!this.closeOnClick()) {
      const optionRef = this.optionsRef()?.nativeElement;

      optionRef?.addEventListener('click', (e: MouseEvent) => {
        const optionEl = e.target as HTMLButtonElement;

        let optionElements = this.activeElements();

        if (!optionElements.length) {
          const newOptionElements = this.optionsEl();
          this.activeElements.set(newOptionElements);
          optionElements = newOptionElements;
        }

        const clickedOptionIndex = optionElements.findIndex((x) => x === optionEl);

        if (clickedOptionIndex > -1) {
          this.activeOptionIndex.set(clickedOptionIndex);
          inputEl.focus();
        }
      });
    }

    inputEl.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
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
            this.activeElements()[activeOptionIndex as number].click();

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

  _lastElementList: HTMLButtonElement[] = [];
  activeElements = signal<HTMLButtonElement[]>([]);
  lastInputValue = '';
  inputValueEffect = effect(() => {
    const searchable = this.searchable();

    if (!searchable) return;

    const inputValue = (this.inputValue() ?? '').toLowerCase();

    this.#resetActiveOption();

    if (!inputValue || inputValue === '') return;

    let optionElements =
      this._lastElementList.length && inputValue.length > this.lastInputValue.length
        ? this._lastElementList
        : this.optionsEl();

    this.lastInputValue = inputValue;

    for (let i = 0; i < optionElements.length; i++) {
      const el = optionElements[i];
      const textContent = el.textContent?.toLowerCase() || '';
      const score = this.#calculateMatchScore(textContent, inputValue);

      (el.value as any) = score;
    }

    optionElements = optionElements
      .filter((x) => (x.value as any) > 0)
      .sort((a, b) => (b.value as any) - (a.value as any));

    for (let i = 0; i < optionElements.length; i++) {
      this.#renderer.setStyle(optionElements[i], 'order', i);
    }

    this.activeElements.set(optionElements);
    this._lastElementList = optionElements;
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
    let optionElements = this.activeElements();

    if (!optionElements.length) {
      const newOptionElements = this.optionsEl();
      this.activeElements.set(newOptionElements);
      optionElements = newOptionElements;
    }

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
    let optionElements = this.activeElements();

    if (!optionElements.length) {
      const newOptionElements = this.optionsEl();
      this.activeElements.set(newOptionElements);
      optionElements = newOptionElements;
    }

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
}
