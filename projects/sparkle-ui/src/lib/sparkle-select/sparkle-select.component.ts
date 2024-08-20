import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'spk-select',
  standalone: true,
  imports: [SparkleFormFieldComponent, SparkleIconComponent],
  template: `
    <div #inputWrapper>
      <spk-form-field (click)="open($event)">
        <ng-content select="label" ngProjectAs="label"></ng-content>

        <div class="input" ngProjectAs="input">
          @if ((_displayValue() && isSearchInput() && !isOpen()) || (_displayValue() && !isSearchInput())) {
            <div class="display-value">{{ _displayValue() }}</div>
          }
          <ng-content select="input"></ng-content>
        </div>

        @if ((!isOpen() && inputVal().length > 0) || !!selectedOption()) {
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
  above = input<boolean>(false);
  right = input<boolean>(false);
  onlyOptionsAllowed = input<boolean>(false);
  displayValue = input<string | null>('');

  #BASE_SPACE = 8;
  #selfRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  #inputRef = computed(() => this.#selfRef.nativeElement.querySelector('input'));
  #inputValue = signal<string>('');
  #previousInputValue = signal<string>('');
  #triggerOption = signal(false);
  #options = computed(() => {
    this.#triggerOption();
    return Array.from(this.optionsRef()?.nativeElement.querySelectorAll<HTMLOptionElement>('option') ?? []);
  });

  _displayValue = computed(() => this.displayValue() ?? this.selectedOption()?.innerText ?? '');
  optionsRef = viewChild<ElementRef<HTMLDivElement>>('optionsRef');
  inputWrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrapper');
  inputVal = this.#inputValue.asReadonly();
  isSearchInput = computed(() => this.#inputRef()?.type === 'search');
  optionsEl = computed(() => this.optionsRef()?.nativeElement);
  isOpen = signal(false);
  delayedIsOpen = signal(false);
  hasBeenOpened = signal(false);
  abortController: AbortController | null = null;
  optionInFocus = signal<number>(0);
  optionsStyle = signal({
    left: '0px',
    top: '0px',
  });
  selectedOption = computed(() =>
    this.#previousInputValue()
      ? this.#options().find((x) => x.getAttribute('value') === this.#previousInputValue())
      : null
  );

  optionsOpenController: AbortController | null = null;

  #optionInFocusEffect = effect(() => {
    if (this.isOpen()) {
      this.computeFocusedElement();
    }

    setTimeout(() => {
      this.delayedIsOpen.set(this.isOpen());
    }, 0);
  });

  #whenInputValueChanged = effect(
    () => {
      if (this.#inputRef()) {
        const val = this.#inputValue();

        this.#inputRef()!.value = val;
        this.#inputRef()!.dispatchEvent(new Event('input'));
      }
    },
    { allowSignalWrites: true }
  );

  #childListObserver = new MutationObserver((mutations) => {
    for (var mutation of mutations) {
      if (mutation.type == 'childList') {
        this.#triggerOption.set(!this.#triggerOption());
        this.optionInFocus.set(this.getIndexOfSelectedOption() > -1 ? this.getIndexOfSelectedOption() : 0);
      }
    }
  });

  computeFocusedElement() {
    for (let i = 0; i < this.#options().length; i++) {
      const option = this.#options()[i];

      option.classList.remove('focused');

      if (this.optionInFocus() === i) {
        option.classList.add('focused');
        option.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  ngOnInit() {
    this.abortController = new AbortController();

    this.#setOptionsElement();

    this.#inputRef()?.addEventListener('focus', (e: FocusEvent) => this.open(e));
    this.#inputRef()?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowDown') {
        if (this.optionInFocus() === null || (this.optionInFocus() as number) === this.#options().length - 1) {
          this.optionInFocus.set(0);
        } else {
          this.optionInFocus.set((this.optionInFocus() as number) + 1);
        }
      } else if (e.key === 'ArrowUp') {
        if (this.optionInFocus() === null || (this.optionInFocus() as number) === 0) {
          this.optionInFocus.set(this.#options().length - 1);
        } else {
          this.optionInFocus.set((this.optionInFocus() as number) - 1);
        }
      } else if (e.key === 'Enter') {
        if (this.optionInFocus() > -1) {
          this.selected(this.getOptionElement(this.optionInFocus() as number));
        }
      } else if (e.key === 'Tab') {
        this.close(true);
      } else {
        this.optionInFocus.set(0);
      }
    });

    this.#inputRef()?.addEventListener('input', (e) => {
      if (this.#inputRef()) {
        this.#inputValue.set(this.#inputRef()!.value);
      }
    });

    window.addEventListener('click', (e) => {
      if (this.#options().indexOf(e.target as HTMLOptionElement) > -1) {
        this.selected(e.target as HTMLOptionElement);
      }
    });
  }

  getOptionElement(index: number) {
    return this.#options()[index];
  }

  deselect($event: Event) {
    $event.stopPropagation();

    if (this.#inputRef()) {
      this.#inputRef()!.value = '';
      this.#inputRef()!.dispatchEvent(new Event('input'));
    }

    this.isOpen.set(false);
    this.hasBeenOpened.set(false);
    this.#inputRef()?.blur();
  }

  selected(el: HTMLOptionElement) {
    if (el) {
      this.#inputValue.set(el.getAttribute('value') ?? '');
    }

    if (this.onlyOptionsAllowed() && !el) {
      this.#inputValue.set('');
    } else {
      this.isOpen.set(false);
      this.hasBeenOpened.set(false);
      this.#inputRef()?.blur();
    }
  }

  #body = document.getElementsByTagName('body')[0];

  #setOptionsElement() {
    setTimeout(() => {
      if (this.optionsEl()) {
        this.#body.appendChild(this.optionsEl()!);
        this.#triggerOption.set(!this.#triggerOption());
      }
    });
  }

  #hideOptionsElement() {
    setTimeout(() => {
      if (this.optionsEl()) {
        this.#body.removeChild(this.optionsEl()!);
        this.#triggerOption.set(!this.#triggerOption());
      }
    });
  }

  close(noBlur = false) {
    if (this.isSearchInput() && this.#previousInputValue()) {
      setTimeout(() => this.#inputValue.set(this.#previousInputValue()));
    }

    this.#hideOptionsElement();

    this.isOpen.set(false);
    this.hasBeenOpened.set(false);
    noBlur || this.#inputRef()?.blur();
    this.#killMenuCalculation();
    this.#childListObserver.disconnect();
  }

  open(e: MouseEvent | FocusEvent) {
    e.preventDefault();

    this.isOpen.set(true);
    this.#setOptionsElement();

    if (this.isSearchInput() && !this.hasBeenOpened()) {
      this.#previousInputValue.set(this.#inputValue());
      this.#inputValue.set('');
      this.#inputRef()!.focus();
    } else if (this.isSearchInput()) {
      this.#inputRef()!.focus();
    } else {
      this.#inputRef()?.blur();
    }

    this.hasBeenOpened.set(true);
    this.#initMenuCalculation();
    this.#triggerOption.set(!this.#triggerOption());

    setTimeout(() => {
      if (this.optionsEl()) {
        this.#childListObserver.observe(this.optionsEl()!, {
          childList: true,
          subtree: true,
        });
      }
    }, 0);
  }

  getIndexOfSelectedOption() {
    const selected = this.selectedOption();

    return selected ? this.#options().indexOf(selected) : -1;
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
      const triggerRect = this.inputWrapperRef()?.nativeElement.getBoundingClientRect();
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
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
