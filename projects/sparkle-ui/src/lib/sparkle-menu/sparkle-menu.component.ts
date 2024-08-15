import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
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
      class="sparkle-popup-menu"
      [class.active]="isActive()"
      #menuRef
      [style]="menuStyle()"
      (click)="close('selected')">
      <div class="sparkle-menu-backdrop" (click)="close('closed')"></div>
      <div class="sparkle-options">
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
  #BASE_SPACE = 8;
  hasBeenOpened = signal(false);
  above = input<boolean>(false);
  right = input<boolean>(false);
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
  options = computed(() => {
    const _options = this.menuEl().querySelectorAll<HTMLElement>('[option]:not([disabled])');

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
        this.#previousOptionElementInFocus.set(el);
      }

      this.optionElementInFocus.set(el);
    },
    {
      allowSignalWrites: true,
    }
  );

  selectedOptionEffect = effect(() => {
    if (this.selectedOption()) {
      this.selectedOption();
    }
  });

  controller: AbortController | null = null;
  signal: AbortSignal | null = null;

  #whenActive = effect(
    () => {
      this.controller = new AbortController();
      this.signal = this.controller.signal;

      if (this.isActive()) {
        this.#setMenuElement();
        this.calculateMenuPosition();
        this.optionInFocus.set(null);
        this.hasBeenOpened.set(true);

        window.addEventListener('resize', () => this.calculateMenuPosition(), { signal: this.signal });
        window.addEventListener('scroll', () => this.calculateMenuPosition(), { signal: this.signal });
        window.addEventListener(
          'click',
          (e) => {
            if (this.menuEl().contains(e.target as Node)) {
              this.optionInFocus.set(null);
              this.isActive.set(false);
              this.#selectOption(e.target as HTMLElement);
            }
          },
          { signal: this.signal }
        );
        window.addEventListener(
          'keydown',
          (e) => {
            if (e.key === 'ArrowDown') {
              if (this.optionInFocus() === null || (this.optionInFocus() as number) === this.options().length - 1) {
                this.optionInFocus.set(0);
              } else {
                this.optionInFocus.set((this.optionInFocus() as number) + 1);
              }
            }

            if (e.key === 'ArrowUp') {
              if (this.optionInFocus() === null || (this.optionInFocus() as number) === 0) {
                this.optionInFocus.set(this.options().length - 1);
              } else {
                this.optionInFocus.set((this.optionInFocus() as number) - 1);
              }
            }

            if (e.key === 'Enter') {
              if (this.optionElementInFocus()) {
                this.optionElementInFocus()!.dispatchEvent(new Event('click'));
                this.#selectOption(this.optionElementInFocus()!);
              }

              this.close('selected');
            }

            if (e.key === 'Escape') {
              this.close('closed');
            }
          },
          { signal: this.signal }
        );
      } else {
        if (this.hasBeenOpened()) {
          this.#hideMenuElement();
        }
      }
    },
    { allowSignalWrites: true }
  );

  #selectOption(el: HTMLElement) {
    if (this.selectedOption() === el) return;

    if (this.selectedOption()) {
      this.#previousSelectedOption.set(this.selectedOption());
    }

    this.selectedOption.set(el);
    this.selectedOptionIndex.set(this.options().indexOf(el));
  }

  #setMenuElement() {
    this.#body.appendChild(this.menuEl());
  }

  #hideMenuElement() {
    this.#body.removeChild(this.menuEl());
  }

  ngOnInit() {
    this.#setMenuElement();
    this.#hideMenuElement();
  }

  toggle() {
    this.isActive.set(!this.isActive());
  }

  close(action: 'closed' | 'selected' = 'closed') {
    this.controller?.abort();
    this.optionInFocus.set(null);
    this.isActive.set(false);
    this.closeAction.emit(action);
  }

  private calculateMenuPosition() {
    if (this.isActive()) {
      const triggerRect = this.actionRef()?.nativeElement.getBoundingClientRect();
      const menuRect = this.menuRef()?.nativeElement.getBoundingClientRect();

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
    if (this.#body.contains(this.menuRef().nativeElement)) {
      this.#hideMenuElement();
    }
  }
}
