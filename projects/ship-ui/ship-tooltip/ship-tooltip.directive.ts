import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ComponentRef,
  computed,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
  signal,
  TemplateRef,
  untracked,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { generateUniqueId } from '@ship-ui/core';

type Timeout = ReturnType<typeof setTimeout>;

@Component({
  selector: 'ship-tooltip-wrapper',
  standalone: true,
  styleUrl: './ship-tooltip.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
  template: `
    <div class="tooltip-content">
      @if (isTemplate()) {
        <ng-container *ngTemplateOutlet="$any(content()); context: { $implicit: tooltipContext }" />
      } @else {
        {{ content() }}
      }
    </div>
  `,

  host: {
    role: 'tooltip',
    '[attr.popover]': '"manual"',
    '[style.position-anchor]': 'positionAnchorName()',
    '[class.below]': 'isBelow()',
  },
})
export class ShipTooltipWrapper {
  positionAnchorName = input.required<string>();
  anchorEl = input.required<ElementRef<HTMLElement>>();
  isOpen = input<boolean>(false);
  content = input<string | TemplateRef<any> | null | undefined>();
  close = input<() => void>(() => {});

  tooltipContext = {
    close: () => this.close()(),
  };

  isTemplate = computed(() => this.content() instanceof TemplateRef);

  #document = inject(DOCUMENT);
  #selfRef = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #positionAbort: AbortController | null = null;

  SUPPORTS_ANCHOR =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc') && CSS.supports('anchor-name', '--abc');

  isBelow = signal<boolean>(false);

  openEffect = effect(() => {
    if (this.isOpen()) {
      queueMicrotask(() => {
        const tooltipEl = this.#selfRef.nativeElement;
        if (!tooltipEl || !tooltipEl.isConnected) return;

        if (this.#positionAbort) {
          this.#positionAbort.abort();
        }
        this.#positionAbort = new AbortController();

        tooltipEl.showPopover();

        if (!this.SUPPORTS_ANCHOR) {
          setTimeout(() => {
            const scrollableParent = this.#findScrollableParent(tooltipEl);

            scrollableParent.addEventListener('scroll', () => this.#calculateTooltipPosition(), {
              signal: this.#positionAbort?.signal,
              passive: true,
            });
            window?.addEventListener('resize', () => this.#calculateTooltipPosition(), {
              signal: this.#positionAbort?.signal,
              passive: true,
            });

            this.#calculateTooltipPosition();
          });
        }
      });
    } else {
      const tooltipEl = this.#selfRef.nativeElement;
      if (tooltipEl) {
        try {
          if (tooltipEl.matches(':popover-open')) {
            tooltipEl.hidePopover();
          }
        } catch (e) {
          
        }
      }
      this.#positionAbort?.abort();
      this.#positionAbort = null;
    }
  });

  ngOnDestroy(): void {
    this.#positionAbort?.abort();
    this.#positionAbort = null;
  }

  #findScrollableParent(element: HTMLElement) {
    const SCROLLABLE_STYLES = ['scroll', 'auto'];
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

  #calculateTooltipPosition = (): void => {
    if (!this.anchorEl()) return;

    const hostRect = this.anchorEl().nativeElement.getBoundingClientRect();
    const tooltipEl = this.#selfRef.nativeElement;
    const tooltipRect = tooltipEl.getBoundingClientRect();

    if (tooltipRect.width === 0 && tooltipRect.height === 0) return;

    const BASE_SPACE = 8;

    
    const topCenter = (t: DOMRect, m: DOMRect) => ({
      left: t.left + t.width / 2 - m.width / 2,
      top: t.top - m.height - BASE_SPACE,
    });
    const bottomCenter = (t: DOMRect, m: DOMRect) => ({
      left: t.left + t.width / 2 - m.width / 2,
      top: t.bottom + BASE_SPACE,
    });

    const topSpanLeft = (t: DOMRect, m: DOMRect) => ({ left: t.right - m.width, top: t.top - m.height - BASE_SPACE });
    const topSpanRight = (t: DOMRect, m: DOMRect) => ({ left: t.left, top: t.top - m.height - BASE_SPACE });
    const bottomSpanLeft = (t: DOMRect, m: DOMRect) => ({ left: t.right - m.width, top: t.bottom + BASE_SPACE });
    const bottomSpanRight = (t: DOMRect, m: DOMRect) => ({ left: t.left, top: t.bottom + BASE_SPACE });

    const tryOrder = [topCenter, topSpanLeft, topSpanRight, bottomCenter, bottomSpanLeft, bottomSpanRight];

    for (const positionFn of tryOrder) {
      const pos = positionFn(hostRect, tooltipRect);
      if (this.#fitsInViewport(pos, tooltipRect)) {
        this.#applyPosition(pos, tooltipEl);
        this.isBelow.set(pos.top > hostRect.top);
        return;
      }
    }

    const fallback = this.#clampToViewport(topCenter(hostRect, tooltipRect), tooltipRect);
    this.#applyPosition(fallback, tooltipEl);
    this.isBelow.set(fallback.top > hostRect.top);
  };

  #applyPosition(pos: { left: number; top: number }, element: HTMLElement) {
    this.#renderer.setStyle(element, 'left', `${pos.left}px`);
    this.#renderer.setStyle(element, 'top', `${pos.top}px`);
    this.#renderer.setStyle(element, 'position', 'fixed');
    this.#renderer.setStyle(element, 'margin', '0');
  }

  #fitsInViewport(pos: { left: number; top: number }, m: DOMRect): boolean {
    return (
      pos.left >= 0 &&
      pos.top >= 0 &&
      pos.left + m.width <= window.innerWidth &&
      pos.top + m.height <= window.innerHeight
    );
  }

  #clampToViewport(pos: { left: number; top: number }, m: DOMRect): { left: number; top: number } {
    return {
      left: Math.max(0, Math.min(pos.left, window.innerWidth - m.width)),
      top: Math.max(0, Math.min(pos.top, window.innerHeight - m.height)),
    };
  }
}

let openRef: {
  wrapperComponentRef: ComponentRef<ShipTooltipWrapper>;
  component: ShipTooltip;
} | null = null;

@Directive({
  selector: '[shTooltip]',
  standalone: true,
  host: {
    class: 'tooltip',
    '[style.anchor-name]': 'anchorName',
    '[class.active]': 'isOpen()',
  },
})
export class ShipTooltip implements OnDestroy {
  shTooltip = input.required<string | TemplateRef<any> | null | undefined>();

  #contentReplacedEffect = effect(() => {
    const content = this.shTooltip();

    untracked(() => {
      if (this.isOpen() && openRef?.component === this && openRef?.wrapperComponentRef) {
        openRef.wrapperComponentRef.setInput('content', content);
        openRef.wrapperComponentRef.changeDetectorRef.detectChanges();
      }
    });
  });

  #elementRef = inject(ElementRef<HTMLElement>);
  #viewContainerRef = inject(ViewContainerRef);
  #environmentInjector = inject(EnvironmentInjector);

  #debounceTimer: Timeout | null = null;
  #DEBOUNCE_DELAY = 50;

  anchorName = `--${generateUniqueId()}`;
  isOpen = signal<boolean>(false);

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent) {
    event.stopPropagation();

    if (openRef && openRef.component.anchorName !== this.anchorName) {
      openRef.component.#cleanupTooltip(true);
    } else {
      this.#cancelCleanupTimer();
    }

    this.#showTooltip();
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent) {
    event.stopPropagation();
    this.#startCleanupTimer();
  }

  ngOnDestroy() {
    this.#cancelCleanupTimer();
    if (openRef?.component === this) {
      this.#cleanupTooltip(true);
    }
  }

  #startCleanupTimer() {
    this.#cancelCleanupTimer();
    this.#debounceTimer = setTimeout(() => {
      this.#cleanupTooltip();
    }, this.#DEBOUNCE_DELAY);
  }

  #cancelCleanupTimer() {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }

    if (this.destroyTimeout) {
      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = null;
    }
  }

  #showTooltip() {
    if (openRef?.wrapperComponentRef || !this.shTooltip()) {
      if (openRef?.component === this && openRef?.wrapperComponentRef) {
        openRef.wrapperComponentRef.setInput('content', this.shTooltip());
      }
      return;
    }

    openRef = {
      wrapperComponentRef: this.#viewContainerRef.createComponent(ShipTooltipWrapper, {
        environmentInjector: this.#environmentInjector,
      }),
      component: this,
    };

    openRef.wrapperComponentRef.setInput('positionAnchorName', this.anchorName);
    openRef.wrapperComponentRef.setInput('anchorEl', this.#elementRef);
    openRef.wrapperComponentRef.setInput('isOpen', this.isOpen);
    openRef.wrapperComponentRef.setInput('content', this.shTooltip());
    openRef.wrapperComponentRef.setInput('close', () => this.#cleanupTooltip(true));
    openRef.wrapperComponentRef.changeDetectorRef.detectChanges();
    openRef.wrapperComponentRef.location.nativeElement.addEventListener('mouseenter', (event: MouseEvent) => {
      event.stopPropagation();
      this.#cancelCleanupTimer();
    });

    openRef.wrapperComponentRef.location.nativeElement.addEventListener('mouseleave', (event: MouseEvent) => {
      event.stopPropagation();
      this.#startCleanupTimer();
    });

    setTimeout(() => {
      this.isOpen.set(true);
    });
  }

  destroyTimeout: Timeout | null = null;

  #cleanupTooltip(immediate = false): void {
    if (openRef?.wrapperComponentRef) {
      if (openRef.component !== this && !immediate) {
        return;
      }

      const refToDestroy = openRef.wrapperComponentRef;
      const componentToClose = openRef.component;

      componentToClose.#cancelCleanupTimer();
      componentToClose.isOpen.set(false);
      try {
        refToDestroy.location.nativeElement.hidePopover();
      } catch (e) {}

      if (immediate) {
        refToDestroy.destroy();
        if (openRef?.wrapperComponentRef === refToDestroy) {
          openRef = null;
        }
      } else {
        componentToClose.destroyTimeout = setTimeout(() => {
          queueMicrotask(() => {
            refToDestroy.destroy();
            if (openRef?.wrapperComponentRef === refToDestroy) {
              openRef = null;
            }
          });
        }, this.#DEBOUNCE_DELAY);
      }
    }
  }
}
