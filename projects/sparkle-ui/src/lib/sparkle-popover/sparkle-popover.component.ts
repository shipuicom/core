import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
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

const SCROLLABLE_STYLES = ['scroll', 'auto'];
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
    '[class.above]': 'above()',
    '[class.right]': 'right()',
    '[class.multi-layer]': 'asMultiLayer()',
  },
})
export class SparklePopoverComponent {
  #cdr = inject(ChangeDetectorRef);

  #BASE_SPACE = 4;
  SUPPORTS_ANCHOR =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  above = input<boolean>(false);
  right = input<boolean>(false);
  asMultiLayer = input<boolean>(false);
  markForCheck = input<unknown>(null);

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

  openAbort: AbortController | null = null;
  openEffect = effect(() => {
    const popoverEl = this.popoverRef()?.nativeElement;
    const open = this.isOpen();

    if (open) {
      if (this.openAbort) {
        this.openAbort.abort();
      }

      this.openAbort = new AbortController();
      const abortOptions = {
        signal: this.openAbort?.signal,
      };
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
        abortOptions
      );

      setTimeout(() => {
        const scrollableParent = this.#findScrollableParent(this.popoverRef()?.nativeElement);

        scrollableParent.addEventListener('scroll', () => this.#calculateMenuPosition(), abortOptions);

        window.addEventListener('resize', () => this.#calculateMenuPosition(), abortOptions);

        this.#calculateMenuPosition();
      });
    } else {
      popoverEl.hidePopover();
      this.openAbort?.abort();
      this.closed.emit();
    }
  });

  markForCheckEffect = effect(() => {
    if (this.markForCheck()) {
      this.#cdr.markForCheck();
    }
  });

  toggleIsOpen(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.disableOpenByClick()) {
      this.isOpen.set(!this.isOpen());
    }
  }

  eventClose($event: MouseEvent) {
    $event.stopPropagation();
    $event.preventDefault();
    this.isOpen.set(false);
  }

  #findScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
      if (
        SCROLLABLE_STYLES.indexOf(window.getComputedStyle(parent).overflowY) > -1 &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return document.documentElement;
  }

  #calculateMenuPosition() {
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
      // Default position below and left aligned
      newLeft = actionLeftInViewport;
      newTop = actionBottomInViewport + this.#BASE_SPACE;

      if (outOfBoundsBottom) {
        // If overflows bottom, try positioning above
        const _newTop = triggerRect.top - menuRect.height - this.#BASE_SPACE;

        // Calculate outOfBoundsTop here
        const outOfBoundsTop = _newTop < 0;

        if (!outOfBoundsTop) newTop = _newTop;
      }

      if (outOfBoundsRight) {
        // If overflows right, position left
        newLeft = triggerRect.right - menuRect.width;

        // Ensure it doesn't go off-screen to the left
        if (newLeft < 0) {
          newLeft = 0;
        }
      }

      const style: any = {
        left: newLeft + 'px',
        top: newTop + 'px',
      };

      this.menuStyle.set(style);
    }
  }
}
