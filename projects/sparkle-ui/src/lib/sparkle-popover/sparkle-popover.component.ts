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
import { SparkleButtonComponent } from '../sparkle-button/sparkle-button.component';
import { generateUniqueId } from '../utilities/random-id';

// TODOS
// - Dynamic location where if outside of the window automatically position it to the top or left

export type SparklePopoverOptions = {
  width?: string;
  height?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
};

const DEFAULT_OPTIONS: SparklePopoverOptions = {
  width: undefined,
  height: undefined,
  closeOnButton: true,
  closeOnEsc: true,
};

@Component({
  selector: 'spk-popover',
  imports: [SparkleButtonComponent],
  template: `
    <div class="trigger" #triggerRef [style.anchor-name]="id()" (click)="toggleIsOpen($event)">
      <div class="trigger-wrapper">
        <ng-content select="[trigger]" />
      </div>

      <button spk-button class="outlined">Open popover</button>
    </div>

    <div popover #popoverRef class="popover" [style.position-anchor]="id()" [style]="menuStyle()">
      <div class="overlay" (click)="isOpen() && eventClose($event)"></div>
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.above]': '_above()',
    '[class.right]': '_right()',
  },
})
export class SparklePopoverComponent {
  #BASE_SPACE = 4;
  SUPPORTS_ANCHOR =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  above = input<boolean>(false);
  right = input<boolean>(false);

  _above = signal<boolean>(this.above());
  _right = signal<boolean>(this.right());
  disableOpenByClick = input<boolean>(false);
  isOpen = model<boolean>(false);
  options = input<Partial<SparklePopoverOptions>>();
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
    ...this.options(),
  }));

  triggerRef = viewChild.required<ElementRef<HTMLElement>>('triggerRef');
  popoverRef = viewChild.required<ElementRef<HTMLElement>>('popoverRef');

  id = signal('--' + generateUniqueId());
  menuStyle = signal<any>(null);

  toggleIsOpen(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.disableOpenByClick()) {
      this.isOpen.set(!this.isOpen());
    }
  }

  openAbort: AbortController | null = null;
  isCalculatingPosition = computed(() => {
    const popoverEl = this.popoverRef()?.nativeElement;
    const open = this.isOpen();

    if (open) {
      if (this.openAbort) {
        this.openAbort.abort();
      }

      this.openAbort = new AbortController();
      popoverEl?.showPopover();

      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape' && !this.defaultOptionMerge().closeOnEsc) {
            e.preventDefault();
          }

          if (e.key === 'Escape' && this.defaultOptionMerge().closeOnEsc) {
            this.isOpen.set(false);
          }
        },
        {
          capture: true,
          signal: this.abortController?.signal,
        }
      );

      return true;
    } else {
      popoverEl.hidePopover();
      this.abortController?.abort();
      this.openAbort?.abort();
      this.closed.emit();
      return false;
    }
  });

  abortController: AbortController | null = null;
  calcPositionEffect = effect(() => {
    const isCalculatingPosition = this.isCalculatingPosition();

    if (!isCalculatingPosition) return;

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.calculateMenuPosition();

    const scrollableParent = this.#findScrollableParent(this.popoverRef()?.nativeElement);

    scrollableParent.addEventListener('scroll', () => this.calculateMenuPosition(), { signal });
    document.addEventListener('resize', () => this.calculateMenuPosition(), { signal });
  });

  scrollableStyles = ['scroll', 'auto'];
  #findScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
      if (
        this.scrollableStyles.indexOf(window.getComputedStyle(parent).overflowY) > -1 &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return document.documentElement;
  }

  eventClose($event: MouseEvent) {
    $event.stopPropagation();
    $event.preventDefault();
    this.isOpen.set(false);
  }

  ngOnDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private calculateMenuPosition() {
    const triggerRect = this.triggerRef()?.nativeElement.getBoundingClientRect();
    const menuRect = this.popoverRef()?.nativeElement.getBoundingClientRect();

    const actionLeftInViewport = triggerRect.left;
    const actionBottomInViewport = triggerRect.bottom;

    let newLeft = actionLeftInViewport;
    let newTop = actionBottomInViewport + this.#BASE_SPACE;

    const outOfBoundsRight = newLeft + menuRect.width > window.innerWidth;
    const outOfBoundsBottom = newTop + menuRect.height > window.innerHeight;

    if (this.SUPPORTS_ANCHOR) {
      this._above.set(outOfBoundsBottom);
      this._right.set(outOfBoundsRight);
    } else {
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
}
