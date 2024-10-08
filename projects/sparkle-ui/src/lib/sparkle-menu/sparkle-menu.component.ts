import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'spk-menu',
  standalone: true,
  imports: [],
  template: `
    <div class="action" #actionRef (click)="toggle()">
      <ng-content />
    </div>

    <div
      #menuRef
      class="sparkle-popup-menu"
      [class.right]="right()"
      [class.above]="above()"
      [class.active]="isActive()"
      [style]="menuStyle()"
      [class]="popupClass()">
      <div class="sparkle-menu-backdrop" (click)="close('closed')"></div>
      <div class="sparkle-options" (click)="close('selected')">
        <ng-content select="[menu]" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
  },
})
export class SparkleMenuComponent {
  private injector = inject(Injector);
  #BASE_SPACE = 8;
  above = input<boolean>(false);
  right = input<boolean>(false);
  popupClass = input<string | null>(null);
  closeAction = output<'closed' | 'selected'>();
  isActive = model<boolean>(false);
  optionInFocus = model<number | null>(null);
  actionRef = viewChild.required<ElementRef<HTMLElement>>('actionRef');
  menuRef = viewChild.required<ElementRef<HTMLElement>>('menuRef');
  menuEl = computed(() => this.menuRef()?.nativeElement);
  menuStyle = signal({
    left: '0px',
    top: '0px',
  });
  optionsElTrigger = signal(false);
  options = computed(() => {
    const _options = this.menuEl().querySelectorAll<HTMLElement>('[option]:not([disabled])');

    this.optionsElTrigger();
    this.isActive();

    return Array.from(_options);
  });

  #previousOptionElementInFocus = signal<HTMLElement | null>(null);
  optionElementInFocus = model<HTMLElement | null>(null);
  #previousSelectedOption = signal<HTMLElement | null>(null);
  selectedOption = model<HTMLElement | null>(null);
  selectedOptionIndex = model<number | null>(null);

  #body = document.getElementsByTagName('body')[0];

  optionInFocusEffect = effect(
    () => {
      if (this.optionInFocus() === null && this.#previousOptionElementInFocus()) {
        this.#previousOptionElementInFocus()?.classList.remove('focused');
        return;
      }

      if (this.options().length === 0 || this.optionInFocus() === null) return;

      const el = this.options().at(this.optionInFocus() as number) as HTMLElement;

      if (this.#previousOptionElementInFocus()) {
        this.#previousOptionElementInFocus()?.classList.remove('focused');
      }

      if (el) {
        el.classList.add('focused');
        el.scrollIntoView({ block: 'nearest' });
        this.#previousOptionElementInFocus.set(el);
        this.optionElementInFocus.set(el);
      } else {
        this.optionElementInFocus.set(null);
      }
    },
    {
      allowSignalWrites: true,
      injector: this.injector,
    }
  );

  controller: AbortController | null = null;

  // TODO cleanup so that we dont have multiple controller effects
  // Its due to the whenActive effect being called in a loop try tracking by only isActive
  setNewController() {
    this.controller?.abort();
    this.controller = new AbortController();
  }

  whenActive = effect(
    () => {
      if (this.isActive()) {
        this.setNewController();

        this.#setMenuElement();
        this.calculateMenuPosition();

        setTimeout(() => {
          const selectedIndex = this.options().findIndex(
            (el) => el.getAttribute('value') === this.selectedOption()?.getAttribute('value')
          );

          if (this.optionInFocus() === null) {
            this.optionInFocus.set(selectedIndex > -1 ? selectedIndex : 0);
          }
        }, 0);

        window.addEventListener('resize', () => this.calculateMenuPosition(), { signal: this.controller?.signal });
        window.addEventListener('scroll', () => this.calculateMenuPosition(), { signal: this.controller?.signal });
        window.addEventListener(
          'keydown',
          (e) => {
            if (e.key === 'ArrowDown') {
              if (this.optionInFocus() === null || (this.optionInFocus() as number) === this.options().length - 1) {
                this.optionInFocus.set(0);
              } else {
                this.optionInFocus.set((this.optionInFocus() as number) + 1);
              }
            } else if (e.key === 'ArrowUp') {
              if (this.optionInFocus() === null || (this.optionInFocus() as number) === 0) {
                this.optionInFocus.set(this.options().length - 1);
              } else {
                this.optionInFocus.set((this.optionInFocus() as number) - 1);
              }
            } else if (e.key === 'Enter') {
              if (this.optionElementInFocus()) {
                this.selectOption(this.optionElementInFocus()!);
              }

              this.close('selected');
            } else if (e.key === 'Escape') {
              this.close('closed');
            } else {
              setTimeout(() => {
                this.optionInFocus.set(0);
                this.optionsElTrigger.set(!this.optionsElTrigger());
              }, 0);
            }
          },
          { signal: this.controller?.signal }
        );
      } else {
        this.#hideMenuElement();
      }
    },
    {
      allowSignalWrites: true,
      injector: this.injector,
    }
  );

  deselectOption() {
    this.#previousSelectedOption.set(null);
    this.selectedOption.set(null);
    this.selectedOptionIndex.set(null);
  }

  setSelectedOption(byInputValue: string) {
    const option = this.options().find((x) => x.hasAttribute('value') && x.getAttribute('value') === byInputValue);

    if (option) {
      this.selectOption(option);
    }
  }

  selectOption(el: HTMLElement) {
    if (this.selectedOption()) {
      this.#previousSelectedOption.set(this.selectedOption());
    }

    this.selectedOption.set(el);
    this.selectedOptionIndex.set(this.options().indexOf(el));

    el.dispatchEvent(
      new Event('click', {
        bubbles: true,
        cancelable: true,
      })
    );
  }

  selectCurrentOption() {
    const selectedOption = this.selectedOptionIndex();
    const option = this.options().at(selectedOption as number);

    if (option) {
      this.selectOption(option!);
    }
  }

  #setMenuElement() {
    this.#body.appendChild(this.menuEl());
  }

  #hideMenuElement() {
    this.#body.removeChild(this.menuEl());
  }

  ngOnInit() {
    this.#setMenuElement();
  }

  toggle() {
    this.isActive.set(!this.isActive());
  }

  close(action: 'closed' | 'selected' = 'closed') {
    this.controller?.abort();
    this.isActive.set(false);
    this.closeAction.emit(action);
  }

  private calculateMenuPosition() {
    if (this.isActive()) {
      const triggerRect = this.actionRef()?.nativeElement.getBoundingClientRect();
      const menuRect = this.menuEl().getBoundingClientRect();

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

      this.menuStyle.set({
        left: newLeft + 'px',
        top: newTop + 'px',
      });
    }
  }

  ngOnDestroy() {
    if (this.#body.contains(this.menuEl())) {
      this.#hideMenuElement();
    }
  }
}
