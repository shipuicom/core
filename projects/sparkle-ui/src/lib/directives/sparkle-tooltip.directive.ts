import {
  ComponentRef,
  createComponent,
  Directive,
  effect,
  ElementRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  inject,
  input,
  Renderer2,
  TemplateRef,
} from '@angular/core';

import { Component } from '@angular/core';

@Component({
  selector: 'sparkle-tooltip-wrapper',
  template: `
    <div class="tooltip-content">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
})
class SparkleTooltipWrapper {}

@Directive({
  selector: '[spkTooltip]',
  host: {
    class: 'tooltip',
  },
})
export class SparkleTooltipDirective {
  spkTooltip = input.required<string | TemplateRef<any>>();

  #elementRef = inject(ElementRef);
  #environmentInjector = inject(EnvironmentInjector);
  #renderer = inject(Renderer2);

  #wrapperComponentRef: ComponentRef<SparkleTooltipWrapper> | null = null;
  #projectedViewRef: EmbeddedViewRef<any> | null = null;

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
        this.#wrapperComponentRef = createComponent(SparkleTooltipWrapper, {
          environmentInjector: this.#environmentInjector,
          projectableNodes: [nodesToProject],
        });

        this.#elementRef.nativeElement.appendChild(this.#wrapperComponentRef.location.nativeElement);
      }
    }
  });

  private cleanupTooltip() {
    if (this.#wrapperComponentRef) {
      this.#elementRef.nativeElement.removeChild(this.#wrapperComponentRef.location.nativeElement);
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
