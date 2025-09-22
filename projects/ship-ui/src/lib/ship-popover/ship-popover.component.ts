import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';

// TODOS
// - Dynamic location where if outside of the window automatically position it to the top or left

export type ShipPopoverOptions = {
  width?: string;
  height?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
};

const BASE_SPACE = 4;
const SCROLLABLE_STYLES = ['scroll', 'auto'];
const DEFAULT_OPTIONS: ShipPopoverOptions = {
  width: undefined,
  height: undefined,
  closeOnButton: true,
  closeOnEsc: true,
};

@Component({
  selector: 'sh-popover',
  imports: [],
  template: `
    <div class="trigger" #triggerRef [attr.popovertarget]="id() + 'hello'" (click)="toggleIsOpen($event)">
      <div class="trigger-wrapper">
        <ng-content select="[trigger]" />
        <ng-content select="button" />
        <ng-content select="[shButton]" />
      </div>
      <div class="trigger-anchor" [style.anchor-name]="id()"></div>
    </div>

    @if (isOpen()) {
      <div [attr.id]="id() + 'hello'" popover="manual" #popoverRef class="popover">
        <div class="overlay" (click)="eventClose($event)"></div>
        <div class="popover-content" #popoverContentRef [style.position-anchor]="id()" [style]="menuStyle()">
          <ng-content />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.multi-layer]': 'asMultiLayer()',
  },
})
export class ShipPopoverComponent {
  #document = inject(DOCUMENT);
  SUPPORTS_ANCHOR =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  asMultiLayer = input<boolean>(false);
  disableOpenByClick = input<boolean>(false);
  isOpen = model<boolean>(false);

  options = input<Partial<ShipPopoverOptions>>();
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
    ...this.options(),
  }));

  triggerRef = viewChild.required<ElementRef<HTMLElement>>('triggerRef');
  popoverRef = viewChild<ElementRef<HTMLElement>>('popoverRef');
  popoverContentRef = viewChild<ElementRef<HTMLElement>>('popoverContentRef');

  id = signal('--' + generateUniqueId());
  menuStyle = signal<any>(null);

  openAbort: AbortController | null = null;
  openEffect = effect(() => {
    const open = this.isOpen();

    queueMicrotask(() => {
      const popoverEl = this.popoverRef()?.nativeElement;

      if (!popoverEl) {
        this.openAbort?.abort();
        this.openAbort = null;
        return;
      }
      if (open) {
        if (this.openAbort) {
          this.openAbort.abort();
        }

        this.openAbort = new AbortController();

        this.#document.addEventListener(
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
            signal: this.openAbort?.signal,
          }
        );

        popoverEl.showPopover();

        if (!this.SUPPORTS_ANCHOR) {
          setTimeout(() => {
            const scrollableParent = this.#findScrollableParent(popoverEl);

            scrollableParent.addEventListener('scroll', () => this.#calculateMenuPosition(), {
              signal: this.openAbort?.signal,
            });
            window?.addEventListener('resize', () => this.#calculateMenuPosition(), {
              signal: this.openAbort?.signal,
            });

            this.#calculateMenuPosition();
          });
        }
      } else {
        this.closed.emit();
        this.openAbort?.abort();
        this.openAbort = null;
      }
    });
  });

  toggleIsOpen(event: MouseEvent) {
    if (!this.disableOpenByClick()) {
      event.preventDefault();
      event.stopPropagation();
      this.isOpen.set(!this.isOpen());
    }
  }

  eventClose($event: MouseEvent) {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
  }

  #findScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
      if (
        SCROLLABLE_STYLES.indexOf(window?.getComputedStyle(parent).overflowY) > -1 &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return this.#document.documentElement;
  }

  #alignLeftUnder(triggerRect: DOMRect, menuRect: DOMRect) {
    const newLeft = triggerRect.left;
    const newTop = triggerRect.bottom + BASE_SPACE;

    return {
      left: newLeft,
      top: newTop,
    };
  }

  #alignTopRight(triggerRect: DOMRect, menuRect: DOMRect) {
    const newLeft = triggerRect.right + BASE_SPACE;
    const newTop = triggerRect.top;

    return {
      left: newLeft,
      top: newTop,
    };
  }

  #alignBottomRight(triggerRect: DOMRect, menuRect: DOMRect) {
    const newLeft = triggerRect.right + BASE_SPACE;
    const newTop = triggerRect.bottom;

    return {
      left: newLeft,
      top: newTop,
    };
  }

  #alignLeftOver(triggerRect: DOMRect, menuRect: DOMRect) {
    const newLeft = triggerRect.left;
    const newTop = triggerRect.bottom - triggerRect.height - menuRect.height - BASE_SPACE;

    return {
      left: newLeft,
      top: newTop,
    };
  }

  #calculateMenuPosition() {
    const triggerRect = this.triggerRef()?.nativeElement.getBoundingClientRect();
    const menuRect = this.popoverContentRef()?.nativeElement.getBoundingClientRect();

    const tryOrderMultiLayer = [this.#alignTopRight, this.#alignBottomRight];
    const tryOrderDefault = [this.#alignLeftUnder, this.#alignLeftOver];
    const tryOrder = this.asMultiLayer() ? tryOrderMultiLayer : tryOrderDefault;

    for (let i = 0; i < tryOrder.length; i++) {
      const position = tryOrder[i](triggerRect, menuRect!);

      const outOfBoundsRight = position.left + (menuRect?.width || 0) > window.innerWidth;
      const outOfBoundsBottom = position.top + (menuRect?.height || 0) > window.innerHeight;

      if (!outOfBoundsRight && !outOfBoundsBottom) {
        this.menuStyle.set({
          left: position.left + 'px',
          top: position.top + 'px',
        });
        return;
      }
    }

    const fallbackPosition = tryOrder[0](triggerRect, menuRect!);
    this.menuStyle.set({
      left: fallbackPosition.left + 'px',
      top: fallbackPosition.top + 'px',
    });
  }

  ngOnDestroy() {
    this.openAbort?.abort();
    this.openAbort = null;
  }
}
