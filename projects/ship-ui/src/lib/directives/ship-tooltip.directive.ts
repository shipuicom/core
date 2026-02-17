import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ComponentRef,
  computed,
  Directive,
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
} from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';

@Component({
  selector: 'ship-tooltip-wrapper',
  standalone: true,
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

  protected tooltipContext = {
    close: () => this.close()(),
  };

  isTemplate = computed(() => this.content() instanceof TemplateRef);

  #selfRef = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #positionAbort: AbortController | null = null;

  readonly SUPPORTS_ANCHOR = typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc');

  isBelow = signal<boolean>(false);

  openEffect = effect(() => {
    if (this.isOpen()) {
      setTimeout(() => {
        this.#selfRef.nativeElement.showPopover();
        this.schedulePositionUpdate();
      });
    } else {
      this.#selfRef.nativeElement.hidePopover();
    }
  });

  ngAfterViewInit() {
    this.#positionAbort = new AbortController();

    const options = { signal: this.#positionAbort.signal, capture: true, passive: true };
    window?.addEventListener('scroll', this.schedulePositionUpdate, options);
    window?.addEventListener('resize', this.schedulePositionUpdate, {
      signal: this.#positionAbort.signal,
      passive: true,
    });

    this.schedulePositionUpdate();
  }

  ngOnDestroy(): void {
    this.#positionAbort?.abort();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private rafId: number | null = null;

  private schedulePositionUpdate = () => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(this.calculateTooltipPosition);
  };

  private calculateTooltipPosition = (): void => {
    this.rafId = null;

    if (!this.anchorEl()) return;

    const hostRect = this.anchorEl().nativeElement.getBoundingClientRect();
    const tooltipEl = this.#selfRef.nativeElement;
    const tooltipRect = tooltipEl.getBoundingClientRect();

    if (tooltipRect.width === 0 && tooltipRect.height === 0) return;

    const outOfBoundsTop = hostRect.top - tooltipRect.height < 0;

    if (this.isBelow() !== outOfBoundsTop) {
      this.isBelow.set(outOfBoundsTop);
    }

    if (!this.SUPPORTS_ANCHOR) {
      const tooltipRect = tooltipEl.getBoundingClientRect();
      let newTop = hostRect.top - tooltipRect.height;
      let newLeft = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;

      if (outOfBoundsTop) {
        newTop = hostRect.top + hostRect.height;
      }

      if (newLeft + tooltipRect.width > window?.innerWidth) {
        newLeft = hostRect.right - tooltipRect.width / 2;
      }
      if (newLeft < 0) {
        newLeft = -(tooltipRect.width / 2);
      }

      const leftStyle = `${newLeft}px`;
      const topStyle = `${newTop}px`;

      if (tooltipEl.style.left !== leftStyle) {
        this.#renderer.setStyle(tooltipEl, 'left', leftStyle);
      }
      if (tooltipEl.style.top !== topStyle) {
        this.#renderer.setStyle(tooltipEl, 'top', topStyle);
      }
      if (tooltipEl.style.position !== 'fixed') {
        this.#renderer.setStyle(tooltipEl, 'position', 'fixed');
      }
    }
  };
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
  #renderer = inject(Renderer2);

  private debounceTimer: any; // Using any for the timer ID
  private readonly DEBOUNCE_DELAY = 500;

  readonly anchorName = `--${generateUniqueId()}`;
  isOpen = signal<boolean>(false);

  @HostListener('mouseenter')
  onMouseEnter() {
    if (openRef?.component.anchorName !== this.anchorName) {
      this.cleanupTooltip();
    }

    this.cancelCleanupTimer();

    queueMicrotask(() => this.showTooltip());
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.startCleanupTimer();
  }

  ngOnDestroy() {
    this.cancelCleanupTimer();
    this.cleanupTooltip();
  }

  private startCleanupTimer() {
    this.cancelCleanupTimer();
    this.debounceTimer = setTimeout(() => {
      this.cleanupTooltip();
    }, this.DEBOUNCE_DELAY);
  }

  private cancelCleanupTimer() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private showTooltip() {
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
    openRef.wrapperComponentRef.setInput('close', () => this.cleanupTooltip());
    openRef.wrapperComponentRef.changeDetectorRef.detectChanges();
    openRef.wrapperComponentRef.location.nativeElement.addEventListener('mouseenter', () => {
      this.cancelCleanupTimer();
    });

    openRef.wrapperComponentRef.location.nativeElement.addEventListener('mouseleave', () => {
      this.startCleanupTimer();
    });

    setTimeout(() => {
      this.isOpen.set(true);
    });
  }

  private cleanupTooltip(): void {
    if (openRef?.wrapperComponentRef) {
      openRef.component.cancelCleanupTimer();
      openRef.wrapperComponentRef.destroy();
      openRef.component.isOpen.set(false);
      openRef = null;
    }
  }
}
