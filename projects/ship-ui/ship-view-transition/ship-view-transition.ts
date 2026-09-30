import { Location } from '@angular/common';
import { booleanAttribute, DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, timeout } from 'rxjs';
import { generateUniqueId } from '@ship-ui/core';
import { ShipViewTransitions, ShipViewTransitionScrubber } from './ship-view-transition.service';
import { ShipViewTransitionSpec } from './ship-view-transition.types';

/** Pointer must start this close to the frame's left edge to count as a swipe back. */
const EDGE_WIDTH = 28;
/** Movement before the swipe is committed to and the navigation starts. */
const SWIPE_SLOP = 8;
/** Release beyond this fraction of the frame width completes the swipe; before it the page stays. */
const COMMIT_PROGRESS = 0.5;
/** Upper bound on how long the page stays locked after a release, in case no navigation follows. */
const LOCK_TIMEOUT = 1500;
/** Events swallowed while a swipe is in flight so nothing else can start a navigation. */
const BLOCKED_EVENTS = [
  'click',
  'auxclick',
  'dblclick',
  'contextmenu',
  'keydown',
  'wheel',
  'touchstart',
  'dragstart',
  'selectstart',
];

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
 * <router-outlet shViewTransition swipeBack />
 * ```
 */
@Directive({
  selector: 'router-outlet[shViewTransition]',
})
export class ShipViewTransition {
  #outlet = inject(RouterOutlet, { self: true });
  #element = inject<ElementRef<HTMLElement>>(ElementRef);
  #transitions = inject(ShipViewTransitions);
  #location = inject(Location);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);
  #name = `sh-vt-${generateUniqueId()}`;

  /**
   * Which animations this outlet plays. Leave empty to use the provider
   * defaults, or pass a spec with `in`, `out`, `back`, `duration`, `easing`.
   */
  spec = input<ShipViewTransitionSpec | '' | null>(null, { alias: 'shViewTransition' });
  /** Clip the sliding pages to the outlet's parent element. Set `false` to let them move across the full viewport. */
  frame = input(true);
  /** iOS-style edge swipe: dragging from the left edge of the frame scrubs a back navigation, release to complete or cancel. */
  swipeBack = input(false, { transform: booleanAttribute });

  #swipe: {
    pointerId: number;
    startX: number;
    width: number;
    lastX: number;
    lastTime: number;
    scrubber: ShipViewTransitionScrubber | null;
    progress: number;
  } | null = null;
  #locked = false;
  #unblock: (() => void) | null = null;

  constructor() {
    this.#outlet.activateEvents.pipe(takeUntilDestroyed()).subscribe(() => this.#tag());
    this.#outlet.attachEvents.pipe(takeUntilDestroyed()).subscribe(() => this.#tag());

    effect((onCleanup) => {
      const frame = this.#element.nativeElement.parentElement;
      if (!this.swipeBack() || !frame) return;

      const down = (event: PointerEvent) => this.#onPointerDown(event, frame);
      const move = (event: PointerEvent) => this.#onPointerMove(event);
      const up = (event: PointerEvent) => this.#onPointerUp(event);
      frame.addEventListener('pointerdown', down);
      frame.addEventListener('pointermove', move);
      frame.addEventListener('pointerup', up);
      frame.addEventListener('pointercancel', up);
      const previousTouchAction = frame.style.touchAction;
      frame.style.touchAction = 'pan-y';

      onCleanup(() => {
        frame.removeEventListener('pointerdown', down);
        frame.removeEventListener('pointermove', move);
        frame.removeEventListener('pointerup', up);
        frame.removeEventListener('pointercancel', up);
        frame.style.touchAction = previousTouchAction;
      });
    });
    this.#destroyRef.onDestroy(() => {
      this.#swipe = null;
      this.#unblock?.();
    });
  }

  #onPointerDown(event: PointerEvent, frame: HTMLElement) {
    if (!event.isPrimary || event.button !== 0 || this.#swipe || this.#locked) return;
    const rect = frame.getBoundingClientRect();
    if (event.clientX - rect.left > EDGE_WIDTH) return;
    if (!this.#canGoBack()) return;

    this.#swipe = {
      pointerId: event.pointerId,
      startX: event.clientX,
      width: rect.width,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      scrubber: null,
      progress: 0,
    };
    frame.setPointerCapture(event.pointerId);
  }

  #onPointerMove(event: PointerEvent) {
    const swipe = this.#swipe;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    const dx = event.clientX - swipe.startX;

    if (!swipe.scrubber) {
      if (dx < SWIPE_SLOP) return;
      this.#block();
      swipe.scrubber = this.#transitions.beginInteractive();
      this.#location.back();
    }

    swipe.progress = Math.min(1, Math.max(0, dx / swipe.width));
    swipe.scrubber.progress(swipe.progress);
    swipe.lastX = event.clientX;
    swipe.lastTime = event.timeStamp;
  }

  #onPointerUp(event: PointerEvent) {
    const swipe = this.#swipe;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    this.#swipe = null;
    if (!swipe.scrubber) return;

    // Only where the finger let go decides; speed does not.
    const commit = event.type !== 'pointercancel' && swipe.progress >= COMMIT_PROGRESS;
    void this.#settle(commit ? swipe.scrubber.finish() : swipe.scrubber.cancel().then(() => this.#afterNavigation()));
  }

  /** Keeps the page locked until the transition (and, after a cancel, the step forward) has landed. */
  async #settle(done: Promise<void>) {
    const view = this.#element.nativeElement.ownerDocument.defaultView;
    const limit = new Promise<void>((resolve) => view?.setTimeout(resolve, LOCK_TIMEOUT));
    try {
      await Promise.race([done, limit]);
    } finally {
      this.#unblock?.();
    }
  }

  /** Swallows every other interaction on the document while a swipe is in flight. */
  #block() {
    if (this.#unblock) return;
    this.#locked = true;
    const doc = this.#element.nativeElement.ownerDocument;
    const frame = this.#element.nativeElement.parentElement;
    const swallow = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const otherPointer = (event: PointerEvent) => {
      if (!this.#swipe || event.pointerId !== this.#swipe.pointerId) swallow(event);
    };
    for (const type of BLOCKED_EVENTS) doc.addEventListener(type, swallow, { capture: true, passive: false });
    doc.addEventListener('pointerdown', otherPointer, { capture: true });
    const previousSelect = frame?.style.userSelect ?? '';
    if (frame) frame.style.userSelect = 'none';

    this.#unblock = () => {
      for (const type of BLOCKED_EVENTS) doc.removeEventListener(type, swallow, { capture: true });
      doc.removeEventListener('pointerdown', otherPointer, { capture: true });
      if (frame) frame.style.userSelect = previousSelect;
      this.#unblock = null;
      this.#locked = false;
    };
  }

  /** Resolves once the router settles the next navigation (the step forward after a cancel). */
  #afterNavigation() {
    return firstValueFrom(
      this.#router.events.pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError
        ),
        timeout(LOCK_TIMEOUT)
      )
    ).then(
      () => undefined,
      () => undefined
    );
  }

  #canGoBack() {
    const view = this.#element.nativeElement.ownerDocument.defaultView as
      (Window & { navigation?: { canGoBack?: boolean } }) | null;
    return view?.navigation?.canGoBack ?? (view?.history.length ?? 0) > 1;
  }

  #tag() {
    const page = this.#element.nativeElement.nextElementSibling as HTMLElement | null;
    if (!page?.style) return;

    const frame = this.frame();
    const parent = this.#element.nativeElement.parentElement;
    page.style.viewTransitionName = this.#name;

    if (frame && parent) {
      parent.style.viewTransitionName = `${this.#name}-frame`;
      page.style.setProperty('view-transition-group', 'nearest');
    }

    const clip = frame && parent ? parent : page;
    const radius = clip.ownerDocument.defaultView?.getComputedStyle(clip).borderRadius || '0px';
    const spec = this.spec();
    this.#transitions.activated(this.#name, spec === '' ? null : spec, frame && !!parent, radius);
  }
}
