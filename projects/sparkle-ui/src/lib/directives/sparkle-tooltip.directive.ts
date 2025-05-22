import {
  ComponentRef,
  Directive,
  effect,
  ElementRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  HostListener,
  inject,
  input,
  Renderer2,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { Component } from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';

@Component({
  selector: 'sparkle-tooltip-wrapper',
  template: `
    <div class="tooltip-content">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  host: {
    '[style.position-anchor]': 'positionAnchorName()',
  },
})
class SparkleTooltipWrapper {
  positionAnchorName = input.required<string>();
}

@Directive({
  selector: '[spkTooltip]',
  host: {
    class: 'tooltip',
    '[style.anchor-name]': 'anchorName()',
  },
})
export class SparkleTooltipDirective {
  spkTooltip = input.required<string | TemplateRef<any>>();

  #elementRef = inject(ElementRef<any>);
  #viewContainerRef = inject(ViewContainerRef);
  #environmentInjector = inject(EnvironmentInjector);
  #renderer = inject(Renderer2);

  #wrapperComponentRef: ComponentRef<SparkleTooltipWrapper> | null = null;
  #projectedViewRef: EmbeddedViewRef<any> | null = null;

  anchorName = signal(`--${generateUniqueId()}`);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const hostElement = this.#elementRef.nativeElement as any;
    // Check if the host element is disabled or readonly
    if (hostElement.hasAttribute('disabled') || hostElement.hasAttribute('readonly')) {
      event.preventDefault(); // Prevent the default click action
      event.stopPropagation(); // Optional: also stop the event from bubbling up
    }
  }

  manageWrapperEffect = effect(() => {
    const content = this.spkTooltip();

    this.cleanupTooltip();

    if (content) {
      let nodesToProject: Node[];

      if (typeof content === 'string') {
        const textNode = this.#renderer.createText(content);
        nodesToProject = [textNode];
      } else if (content instanceof TemplateRef) {
        this.#projectedViewRef = content.createEmbeddedView(null);
        this.#projectedViewRef.detectChanges();
        nodesToProject = this.#projectedViewRef.rootNodes;
      } else {
        nodesToProject = [];
      }

      if (nodesToProject.length > 0) {
        this.#wrapperComponentRef = this.#viewContainerRef.createComponent(SparkleTooltipWrapper, {
          environmentInjector: this.#environmentInjector,
          projectableNodes: [nodesToProject],
        });

        this.#wrapperComponentRef.setInput('positionAnchorName', this.anchorName());
        this.#wrapperComponentRef.changeDetectorRef.detectChanges();
      }
    }
  });

  private cleanupTooltip() {
    if (this.#wrapperComponentRef) {
      this.#wrapperComponentRef.destroy();
      this.#wrapperComponentRef = null;
    }
    if (this.#projectedViewRef) {
      this.#projectedViewRef.destroy();
      this.#projectedViewRef = null;
    }
  }

  ngOnDestroy() {
    this.cleanupTooltip();
  }
}
