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
  selector: 'sparkle-tooltip-wrapper',
  standalone: true,
  template: `
    <div class="tooltip-content">
      <ng-content></ng-content>
    </div>
  `,
  host: {
    role: 'tooltip',
    '[attr.popover]': '"auto"',
    '[style.position-anchor]': 'positionAnchorName()',
    '[class.below]': 'isBelow()',
  },
})
export class SparkleTooltipWrapper {
  positionAnchorName = input.required<string>();
  anchorEl = input.required<ElementRef<HTMLElement>>();
  isOpen = input<boolean>(false);

  #selfRef = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #positionAbort: AbortController | null = null;

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

  ngAfterViewInit(): void {
    this.#positionAbort = new AbortController();
    const options = { signal: this.#positionAbort.signal, capture: true };
    window.addEventListener('scroll', this.calculateTooltipPosition, options);
    window.addEventListener('resize', this.calculateTooltipPosition, { signal: this.#positionAbort.signal });

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

    if (!this.SUPPORTS_ANCHOR) {
      const outOfBoundsTop = hostRect.top - tooltipRect.height < 0;

      let newTop = hostRect.top - tooltipRect.height;
      let newLeft = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;

      if (outOfBoundsTop) {
        newTop = hostRect.top + hostRect.height;
        this.isBelow.set(true);
      } else {
        this.isBelow.set(false);
      }

      if (newLeft + tooltipRect.width > window.innerWidth) {
        newLeft = hostRect.right - tooltipRect.width / 2;
      }
      if (newLeft < 0) {
        newLeft = -(tooltipRect.width / 2);
      }

      this.#renderer.setStyle(tooltipEl, 'left', `${newLeft}px`);
      this.#renderer.setStyle(tooltipEl, 'top', `${newTop}px`);
      this.#renderer.setStyle(tooltipEl, 'position', 'fixed');
    } else {
      this.isBelow.set(hostRect.top < tooltipRect.bottom);
    }
  };
}

@Directive({
  selector: '[spkTooltip]',
  standalone: true,
  host: {
    class: 'tooltip',
    '[style.anchor-name]': 'anchorName',
    '[class.active]': 'isOpen()',
  },
})
export class SparkleTooltipDirective implements OnDestroy {
  spkTooltip = input.required<string | TemplateRef<any> | null | undefined>();

  #elementRef = inject(ElementRef<HTMLElement>);
  #viewContainerRef = inject(ViewContainerRef);
  #environmentInjector = inject(EnvironmentInjector);
  #renderer = inject(Renderer2);
  #wrapperComponentRef: ComponentRef<SparkleTooltipWrapper> | null = null;
  #projectedViewRef: EmbeddedViewRef<any> | null = null;

  readonly anchorName = `--${generateUniqueId()}`;
  isOpen = signal<boolean>(false);

  @HostListener('mouseenter')
  onMouseEnter() {
    this.showTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.cleanupTooltip();
  }

  ngOnDestroy() {
    this.cleanupTooltip();
  }

  private showTooltip() {
    if (this.#wrapperComponentRef || !this.spkTooltip()) return;

    this.isOpen.set(true);

    let nodesToProject: Node[][];
    const content = this.spkTooltip();
    if (typeof content === 'string') {
      nodesToProject = [[this.#renderer.createText(content)]];
    } else if (content instanceof TemplateRef) {
      this.#projectedViewRef = content.createEmbeddedView({});
      this.#projectedViewRef.detectChanges();
      nodesToProject = [this.#projectedViewRef.rootNodes];
    } else {
      return;
    }

    this.#wrapperComponentRef = this.#viewContainerRef.createComponent(SparkleTooltipWrapper, {
      environmentInjector: this.#environmentInjector,
      projectableNodes: nodesToProject,
    });
    this.#wrapperComponentRef.setInput('positionAnchorName', this.anchorName);
    this.#wrapperComponentRef.setInput('anchorEl', this.#elementRef);
    this.#wrapperComponentRef.setInput('isOpen', this.isOpen);
    this.#wrapperComponentRef.changeDetectorRef.detectChanges();
  }

  private cleanupTooltip(): void {
    this.isOpen.set(false);
    if (this.#wrapperComponentRef) {
      this.#wrapperComponentRef.destroy();
      this.#wrapperComponentRef = null;
    }
    if (this.#projectedViewRef) {
      this.#projectedViewRef.destroy();
      this.#projectedViewRef = null;
    }
  }
}
