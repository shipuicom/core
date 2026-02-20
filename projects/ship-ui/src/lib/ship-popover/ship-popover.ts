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
export class ShipPopover {
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

        if (!popoverEl.isConnected) return;

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
        popoverEl.hidePopover();
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

  /**
   * Position generators that mirror the CSS position-try-fallbacks.
   * Each returns { left, top } for the popover-content in fixed coordinates.
   */

  // bottom span-right: below trigger, left edge aligned with trigger left
  #bottomSpanRight(t: DOMRect, _m: DOMRect) {
    return { left: t.left, top: t.bottom + BASE_SPACE };
  }

  // top span-right: above trigger, left edge aligned with trigger left
  #topSpanRight(t: DOMRect, m: DOMRect) {
    return { left: t.left, top: t.top - m.height - BASE_SPACE };
  }

  // bottom span-left: below trigger, right edge aligned with trigger right
  #bottomSpanLeft(t: DOMRect, m: DOMRect) {
    return { left: t.right - m.width, top: t.bottom + BASE_SPACE };
  }

  // top span-left: above trigger, right edge aligned with trigger right
  #topSpanLeft(t: DOMRect, m: DOMRect) {
    return { left: t.right - m.width, top: t.top - m.height - BASE_SPACE };
  }

  // right span-bottom: to the right of trigger, top edge aligned with trigger top
  #rightSpanBottom(t: DOMRect, _m: DOMRect) {
    return { left: t.right + BASE_SPACE, top: t.top };
  }

  // left span-bottom: to the left of trigger, top edge aligned with trigger top
  #leftSpanBottom(t: DOMRect, m: DOMRect) {
    return { left: t.left - m.width - BASE_SPACE, top: t.top };
  }

  // right center: to the right of trigger, vertically centered
  #rightCenter(t: DOMRect, m: DOMRect) {
    return { left: t.right + BASE_SPACE, top: t.top + t.height / 2 - m.height / 2 };
  }

  // left center: to the left of trigger, vertically centered
  #leftCenter(t: DOMRect, m: DOMRect) {
    return { left: t.left - m.width - BASE_SPACE, top: t.top + t.height / 2 - m.height / 2 };
  }

  // right span-top: to the right of trigger, bottom edge aligned with trigger bottom
  #rightSpanTop(t: DOMRect, m: DOMRect) {
    return { left: t.right + BASE_SPACE, top: t.bottom - m.height };
  }

  // left span-top: to the left of trigger, bottom edge aligned with trigger bottom
  #leftSpanTop(t: DOMRect, m: DOMRect) {
    return { left: t.left - m.width - BASE_SPACE, top: t.bottom - m.height };
  }

  /** Check if a position fits entirely within the viewport */
  #fitsInViewport(pos: { left: number; top: number }, m: DOMRect): boolean {
    return (
      pos.left >= 0 &&
      pos.top >= 0 &&
      pos.left + m.width <= window.innerWidth &&
      pos.top + m.height <= window.innerHeight
    );
  }

  /** Clamp a position so the popover stays within the viewport */
  #clampToViewport(pos: { left: number; top: number }, m: DOMRect): { left: number; top: number } {
    return {
      left: Math.max(0, Math.min(pos.left, window.innerWidth - m.width)),
      top: Math.max(0, Math.min(pos.top, window.innerHeight - m.height)),
    };
  }

  #calculateMenuPosition() {
    const triggerRect = this.triggerRef()?.nativeElement.getBoundingClientRect();
    const menuRect = this.popoverContentRef()?.nativeElement.getBoundingClientRect();

    if (!triggerRect || !menuRect) return;

    // Mirror the CSS position-try-fallbacks order
    const tryOrderDefault = [
      this.#bottomSpanRight,
      this.#topSpanRight,
      this.#bottomSpanLeft,
      this.#topSpanLeft,
      this.#rightSpanBottom,
      this.#leftSpanBottom,
      this.#rightCenter,
      this.#leftCenter,
      this.#rightSpanTop,
      this.#leftSpanTop,
    ];

    const tryOrderMultiLayer = [
      this.#rightSpanBottom,
      this.#rightSpanTop,
      this.#leftSpanBottom,
      this.#leftSpanTop,
      this.#rightCenter,
      this.#leftCenter,
      this.#bottomSpanRight,
      this.#topSpanRight,
      this.#bottomSpanLeft,
      this.#topSpanLeft,
    ];

    const tryOrder = this.asMultiLayer() ? tryOrderMultiLayer : tryOrderDefault;

    // Try each position, use the first one that fits
    for (const positionFn of tryOrder) {
      const pos = positionFn.call(this, triggerRect, menuRect);

      if (this.#fitsInViewport(pos, menuRect)) {
        this.menuStyle.set({ left: pos.left + 'px', top: pos.top + 'px' });
        return;
      }
    }

    // If nothing fits perfectly, use the first position clamped to viewport
    const fallback = this.#clampToViewport(tryOrder[0].call(this, triggerRect, menuRect), menuRect);
    this.menuStyle.set({ left: fallback.left + 'px', top: fallback.top + 'px' });
  }

  ngOnDestroy() {
    this.openAbort?.abort();
    this.openAbort = null;
  }
}
