import {
  Component,
  ComponentRef,
  Directive,
  effect,
  ElementRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';

@Component({
  selector: 'ship-tooltip-wrapper',
  standalone: true,
  template: `
    <div class="tooltip-content">
      <ng-content />
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

  #selfRef = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #positionAbort: AbortController | null = null;

  // readonly BASE_SPACE = 8;
  readonly SUPPORTS_ANCHOR = typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--abc');

  isBelow = signal<boolean>(false);

  openEffect = effect(() => {
    if (this.isOpen()) {
      setTimeout(() => {
        this.#selfRef.nativeElement.showPopover();
        this.calculateTooltipPosition();
      });
    } else {
      this.#selfRef.nativeElement.hidePopover();
    }
  });

  ngAfterViewInit() {
    this.#positionAbort = new AbortController();

    const options = { signal: this.#positionAbort.signal, capture: true };
    window?.addEventListener('scroll', this.calculateTooltipPosition, options);
    window?.addEventListener('resize', this.calculateTooltipPosition, { signal: this.#positionAbort.signal });

    setTimeout(() => this.calculateTooltipPosition());
  }

  ngOnDestroy(): void {
    this.#positionAbort?.abort();
  }

  private calculateTooltipPosition = (): void => {
    if (!this.anchorEl()) return;

    const hostRect = this.anchorEl().nativeElement.getBoundingClientRect();
    const tooltipEl = this.#selfRef.nativeElement;
    const tooltipRect = tooltipEl.getBoundingClientRect();

    if (tooltipRect.width === 0 && tooltipRect.height === 0) return;

    const outOfBoundsTop = hostRect.top - tooltipRect.height < 0;

    this.isBelow.set(outOfBoundsTop);

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

      this.#renderer.setStyle(tooltipEl, 'left', `${newLeft}px`);
      this.#renderer.setStyle(tooltipEl, 'top', `${newTop}px`);
      this.#renderer.setStyle(tooltipEl, 'position', 'fixed');
    }
  };
}

let openRef: {
  wrapperComponentRef: ComponentRef<ShipTooltipWrapper>;
  component: ShipTooltipDirective;
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
export class ShipTooltipDirective implements OnDestroy {
  shTooltip = input.required<string | TemplateRef<any> | null | undefined>();

  #elementRef = inject(ElementRef<HTMLElement>);
  #viewContainerRef = inject(ViewContainerRef);
  #environmentInjector = inject(EnvironmentInjector);
  #renderer = inject(Renderer2);

  #projectedViewRef: EmbeddedViewRef<any> | null = null;
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
    if (openRef?.wrapperComponentRef || !this.shTooltip()) return;

    let nodesToProject: Node[][];
    const content = this.shTooltip();
    if (typeof content === 'string') {
      nodesToProject = [[this.#renderer.createText(content)]];
    } else if (content instanceof TemplateRef) {
      this.#projectedViewRef = content.createEmbeddedView({});
      this.#projectedViewRef.detectChanges();
      nodesToProject = [this.#projectedViewRef.rootNodes];
    } else {
      return;
    }

    openRef = {
      wrapperComponentRef: this.#viewContainerRef.createComponent(ShipTooltipWrapper, {
        environmentInjector: this.#environmentInjector,
        projectableNodes: nodesToProject,
      }),
      component: this,
    };

    openRef.wrapperComponentRef.setInput('positionAnchorName', this.anchorName);
    openRef.wrapperComponentRef.setInput('anchorEl', this.#elementRef);
    openRef.wrapperComponentRef?.setInput('isOpen', this.isOpen);
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

    if (this.#projectedViewRef) {
      this.#projectedViewRef.destroy();
      this.#projectedViewRef = null;
    }
  }
}
