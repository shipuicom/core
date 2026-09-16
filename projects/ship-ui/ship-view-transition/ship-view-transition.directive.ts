import { Directive, ElementRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { generateUniqueId } from '@ship-ui/core';
import { ShipViewTransitions } from './ship-view-transition.service';
import { ShipViewTransitionSpec } from './ship-view-transition.types';

/**
 * Animates the pages a `router-outlet` swaps between using the View Transition API.
 *
 * Every activated page gets its own `view-transition-name`, so nested outlets
 * can run different animations in the same navigation. The outlet's parent
 * element becomes the clipping frame, so slides stay inside it.
 *
 * ```html
 * <router-outlet shViewTransition />
 * <router-outlet [shViewTransition]="{ in: slideFromRight, out: slideToLeft, back: { in: slideFromLeft, out: slideToRight } }" />
 * ```
 */
@Directive({
  selector: 'router-outlet[shViewTransition]',
})
export class ShipViewTransition {
  #outlet = inject(RouterOutlet, { self: true });
  #element = inject<ElementRef<HTMLElement>>(ElementRef);
  #transitions = inject(ShipViewTransitions);
  #name = `sh-vt-${generateUniqueId()}`;

  /**
   * Which animations this outlet plays. Leave empty to use the provider
   * defaults, or pass a spec with `in`, `out`, `back`, `duration`, `easing`.
   */
  spec = input<ShipViewTransitionSpec | '' | null>(null, { alias: 'shViewTransition' });
  /** Clip the sliding pages to the outlet's parent element. Set `false` to let them move across the full viewport. */
  frame = input(true);

  constructor() {
    this.#outlet.activateEvents.pipe(takeUntilDestroyed()).subscribe(() => this.#tag());
    this.#outlet.attachEvents.pipe(takeUntilDestroyed()).subscribe(() => this.#tag());
  }

  #tag() {
    const page = this.#element.nativeElement.nextElementSibling as HTMLElement | null;
    if (!page?.style) return;

    const frame = this.frame();
    page.style.viewTransitionName = this.#name;

    if (frame) {
      const parent = this.#element.nativeElement.parentElement;
      if (parent) {
        parent.style.viewTransitionName = `${this.#name}-frame`;
        page.style.setProperty('view-transition-group', 'nearest');
      }
    }

    const spec = this.spec();
    this.#transitions.activated(this.#name, spec === '' ? null : spec, frame);
  }
}
