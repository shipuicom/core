import { DOCUMENT, inject, Injectable, InjectionToken, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
  ViewTransitionInfo,
} from '@angular/router';
import { filter, firstValueFrom, timeout } from 'rxjs';
import {
  ShipViewTransitionAnimation,
  ShipViewTransitionConfig,
  ShipViewTransitionDirection,
  ShipViewTransitionNavigationInfo,
  ShipViewTransitionPair,
  ShipViewTransitionRef,
  ShipViewTransitionSpec,
} from './ship-view-transition.types';

export const SHIP_VIEW_TRANSITIONS_CONFIG = new InjectionToken<ShipViewTransitionConfig>(
  'SHIP_VIEW_TRANSITIONS_CONFIG'
);

/** Route `data` key that opts a route (and everything below it) out of animating: `data: { shipViewTransition: false }`. */
export const SHIP_VIEW_TRANSITION_ROUTE_DATA = 'shipViewTransition';

const DEFAULT_DURATION = 350;
const DEFAULT_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
/** Longest we wait for the router to settle a navigation the gesture triggered. */
const LOCK_TIMEOUT = 1500;
/** How long the cancel scrub back to the start takes. */
const CANCEL_DURATION = 180;

/**
 * Handle for a gesture-driven transition, returned by
 * {@link ShipViewTransitions.beginInteractive}. The transition's animations are
 * paused and scrubbed with `progress()` until `finish()` or `cancel()`.
 */
export interface ShipViewTransitionScrubber {
  /** Seek every animation of the transition to `progress` (0..1). */
  progress(progress: number): void;
  /** Play the rest of the transition from the current progress. */
  finish(): Promise<void>;
  /** Scrub the transition back to the start, then return to the page the gesture left without any visible swap. */
  cancel(): Promise<void>;
}

interface ResolvedPair {
  in: ShipViewTransitionAnimation;
  out: ShipViewTransitionAnimation;
  duration: number;
  easing: string;
}

/**
 * Coordinates routed view transitions: works out the navigation direction,
 * lazily injects the keyframes that outlets actually use, and writes the
 * per-outlet `::view-transition-old/new` rules for the transition in flight.
 *
 * Provided by {@link provideShipViewTransitions}; the `shViewTransition`
 * directive talks to it, apps rarely need to.
 */
@Injectable()
export class ShipViewTransitions {
  #config = inject(SHIP_VIEW_TRANSITIONS_CONFIG);
  #document = inject(DOCUMENT);
  #router = inject(Router);

  #registry = new Map<string, ShipViewTransitionAnimation>();
  #injected = new Set<string>();
  #static = this.#sheet();
  #dynamic = this.#sheet();
  #staticText = '';
  #dynamicText = '';

  #active: ViewTransitionInfo | null = null;
  #changed = 0;
  #pendingScrubber: InteractiveScrubber | null = null;

  #direction = signal<ShipViewTransitionDirection | null>(null);
  /** Direction of the transition in flight, `null` when none is running. */
  direction = this.#direction.asReadonly();

  constructor() {
    for (const animation of this.#config.animations ?? []) this.register(animation);
    for (const pair of [this.#config.forward, this.#config.back]) {
      for (const ref of [pair?.in, pair?.out]) if (ref && typeof ref !== 'string') this.register(ref);
    }
    this.#appendStatic(
      `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`
    );
  }

  /** Makes an animation referencable by name from `shViewTransition` specs. */
  register(animation: ShipViewTransitionAnimation) {
    const existing = this.#registry.get(animation.name);
    if (existing && existing !== animation && typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(`[ShipViewTransitions] two animations are registered as "${animation.name}"; the last one wins.`);
    }
    this.#registry.set(animation.name, animation);
  }

  /** Called by the router feature for every created transition. */
  onCreated(info: ViewTransitionInfo) {
    const scrubber = this.#pendingScrubber;
    this.#pendingScrubber = null;
    const direction = scrubber ? 'back' : this.#directionFor(info);

    if (direction === null || this.#reducedMotion()) {
      info.transition.skipTransition();
      scrubber?.attach([], info.transition);
      return;
    }

    this.#active = info;
    this.#changed = 0;
    this.#direction.set(direction);

    if (scrubber) {
      const doc = this.#document;
      info.transition.ready.then(
        () => {
          const animations = (doc.getAnimations?.() ?? []).filter(
            (animation) => !!(animation.effect as KeyframeEffect | null)?.pseudoElement
          );
          for (const animation of animations) {
            // The finger drives progress, so the easing curve must not. CSS
            // animations keep their timing function on every keyframe, so it is
            // rewritten there rather than on the effect.
            const effect = animation.effect as KeyframeEffect | null;
            effect?.setKeyframes(effect.getKeyframes().map((keyframe) => ({ ...keyframe, easing: 'linear' })));
            animation.pause();
            animation.currentTime = 0;
          }
          scrubber.attach(animations, info.transition);
        },
        () => scrubber.attach([], info.transition)
      );
    }
    this.#dynamicText = '';
    this.#apply(this.#dynamic, this.#dynamicText);

    const html = this.#document.documentElement;
    html.setAttribute('data-sh-vt', direction);

    // The router swaps the outlets inside the update callback. If no
    // `shViewTransition` outlet reported a change by the time it is done,
    // nothing of ours is animating and the frozen frame is only in the way.
    info.transition.updateCallbackDone.then(
      () => {
        if (this.#active === info && this.#changed === 0) info.transition.skipTransition();
      },
      () => {}
    );

    info.transition.finished.finally(() => {
      if (this.#active !== info) return;
      this.#active = null;
      this.#direction.set(null);
      this.#dynamicText = '';
      this.#apply(this.#dynamic, this.#dynamicText);
      html.removeAttribute('data-sh-vt');
    });
  }

  /**
   * Prepares the next router transition to be driven by a gesture instead of
   * playing on its own. Call it right before triggering the navigation
   * (typically `Location.back()`), then feed the returned scrubber.
   */
  beginInteractive(): ShipViewTransitionScrubber {
    const scrubber = new InteractiveScrubber(() => this.#stepForwardSilently());
    this.#pendingScrubber = scrubber;
    return scrubber;
  }

  /**
   * Called by the directive when its outlet activates a new page. Writes the
   * animation rules for that outlet if a transition is in flight.
   */
  activated(name: string, spec: ShipViewTransitionSpec | null, frame: boolean, radius = '0px') {
    const direction = this.#direction();
    if (!this.#active || !direction) return;

    const pair = this.#resolve(spec, direction);
    this.#changed++;

    const timing = `${pair.duration}ms ${pair.easing} both`;
    const newAbove = pair.in.layer !== 'below' && pair.out.layer !== 'above';
    // The group's box is the page's own box, so clipping there keeps sliding
    // snapshots inside the page area in every browser with view transitions.
    const rules = [
      `::view-transition-group(${name}) { overflow: clip; border-radius: ${radius}; }`,
      `::view-transition-image-pair(${name}) { isolation: auto; }`,
      `::view-transition-old(${name}) { animation: ${this.#animation(pair.out, timing)}; mix-blend-mode: normal; z-index: ${newAbove ? 1 : 2}; }`,
      `::view-transition-new(${name}) { animation: ${this.#animation(pair.in, timing)}; mix-blend-mode: normal; z-index: ${newAbove ? 2 : 1}; }`,
    ];

    if (frame) {
      const frameTiming = `animation-duration: ${pair.duration}ms;`;
      rules.push(
        `::view-transition-group(${name}-frame) { overflow: clip; border-radius: ${radius}; ${frameTiming} }`,
        `::view-transition-old(${name}-frame), ::view-transition-new(${name}-frame) { ${frameTiming} }`
      );
    }

    this.#dynamicText += rules.join('\n') + '\n';
    this.#apply(this.#dynamic, this.#dynamicText);
  }

  /**
   * Steps history forward without letting the router start a view transition,
   * so the interactive transition that is still showing stays on screen until
   * the page the gesture started on is back in the DOM.
   */
  #stepForwardSilently(): Promise<void> {
    const doc = this.#document as Document & { startViewTransition?: unknown };
    const view = doc.defaultView;
    if (!view) return Promise.resolve();

    const settled = firstValueFrom(
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

    // The router's feature checks `document.startViewTransition` before every navigation.
    Object.defineProperty(doc, 'startViewTransition', { value: undefined, configurable: true, writable: true });
    const restore = () => {
      delete (doc as { startViewTransition?: unknown }).startViewTransition;
    };
    view.history.forward();
    return settled.then(restore, restore);
  }

  #animation(animation: ShipViewTransitionAnimation, timing: string) {
    if (animation.name === 'none' || !animation.keyframes) return 'none';
    this.#inject(animation);
    const parts = timing.split(' ');
    if (animation.duration !== undefined) parts[0] = `${animation.duration}ms`;
    if (animation.easing) parts[1] = animation.easing;
    return `${animation.name} ${parts.join(' ')}`;
  }

  #inject(animation: ShipViewTransitionAnimation) {
    if (this.#injected.has(animation.name)) return;
    this.#injected.add(animation.name);
    this.#appendStatic(`@keyframes ${animation.name} { ${animation.keyframes} }`);
  }

  #resolve(spec: ShipViewTransitionSpec | null, direction: ShipViewTransitionDirection): ResolvedPair {
    const config = this.#config;
    const configPair: ShipViewTransitionPair = (direction === 'back' ? config.back : undefined) ?? config.forward;
    const specPair: ShipViewTransitionPair | undefined = direction === 'back' ? spec?.back : (spec ?? undefined);

    return {
      in: this.#lookup(specPair?.in ?? configPair.in, 'in'),
      out: this.#lookup(specPair?.out ?? configPair.out, 'out'),
      duration: spec?.duration ?? config.duration ?? DEFAULT_DURATION,
      easing: spec?.easing ?? config.easing ?? DEFAULT_EASING,
    };
  }

  #lookup(ref: ShipViewTransitionRef | undefined, side: 'in' | 'out'): ShipViewTransitionAnimation {
    if (!ref) return { name: 'none', keyframes: '' };
    if (typeof ref !== 'string') return ref;
    const found = this.#registry.get(ref);
    if (!found) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn(
          `[ShipViewTransitions] no animation named "${ref}" for "${side}". Add it to the provider's "animations" list.`
        );
      }
      return { name: 'none', keyframes: '' };
    }
    return found;
  }

  #directionFor(info: ViewTransitionInfo): ShipViewTransitionDirection | null {
    const navigation = this.#router.getCurrentNavigation();
    const navInfo = navigation?.extras.info as ShipViewTransitionNavigationInfo | undefined;

    if (navInfo?.shipViewTransition === false) return null;
    if (this.#optedOut(info.to)) return null;
    if (navInfo?.shipViewTransition) return navInfo.shipViewTransition;
    if (navigation?.trigger === 'popstate') return 'back';

    const fromDepth = this.#depth(info.from);
    const toDepth = this.#depth(info.to);
    if (toDepth !== fromDepth) return toDepth > fromDepth ? 'forward' : 'back';

    // Same depth: siblings under one parent go left-to-right by their order in the route config (tabs).
    let from: ActivatedRouteSnapshot | null = info.from;
    let to: ActivatedRouteSnapshot | null = info.to;
    while (from && to && from.routeConfig === to.routeConfig) {
      from = from.firstChild;
      to = to.firstChild;
    }
    const siblings = to?.parent?.routeConfig?.children ?? this.#router.config;
    if (from?.routeConfig && to?.routeConfig) {
      const fromIndex = siblings.indexOf(from.routeConfig);
      const toIndex = siblings.indexOf(to.routeConfig);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) return toIndex > fromIndex ? 'forward' : 'back';
    }
    return 'forward';
  }

  #optedOut(snapshot: ActivatedRouteSnapshot | null): boolean {
    for (let node = snapshot; node; node = node.firstChild) {
      if (node.data?.[SHIP_VIEW_TRANSITION_ROUTE_DATA] === false) return true;
    }
    return false;
  }

  #depth(snapshot: ActivatedRouteSnapshot | null) {
    let depth = 0;
    for (let node = snapshot; node; node = node.firstChild) depth += node.url.length;
    return depth;
  }

  #reducedMotion() {
    if (this.#config.respectReducedMotion === false) return false;
    const view = this.#document.defaultView;
    return !!view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  #appendStatic(css: string) {
    this.#staticText += css + '\n';
    this.#apply(this.#static, this.#staticText);
  }

  #sheet(): CSSStyleSheet | HTMLStyleElement | null {
    const doc = this.#document;
    if (!doc?.documentElement || typeof (doc.defaultView as any)?.CSSStyleSheet === 'undefined') return null;

    if ('adoptedStyleSheets' in doc && typeof CSSStyleSheet.prototype.replaceSync === 'function') {
      const sheet = new CSSStyleSheet();
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      return sheet;
    }

    const style = doc.createElement('style');
    style.setAttribute('data-sh-view-transitions', '');
    doc.head.appendChild(style);
    return style;
  }

  #apply(target: CSSStyleSheet | HTMLStyleElement | null, text: string) {
    if (!target) return;
    if (target instanceof HTMLStyleElement) target.textContent = text;
    else target.replaceSync(text);
  }
}

class InteractiveScrubber implements ShipViewTransitionScrubber {
  #animations: Animation[] = [];
  #transition: ViewTransition | null = null;
  #progress = 0;
  #done: 'finish' | 'cancel' | null = null;
  #resolveAttached!: () => void;
  #attached = new Promise<void>((resolve) => (this.#resolveAttached = resolve));

  constructor(private readonly stepForward: () => Promise<void>) {}

  attach(animations: Animation[], transition: ViewTransition) {
    this.#animations = animations;
    this.#transition = transition;
    this.#seek(this.#progress);
    this.#resolveAttached();
    if (this.#done === 'finish') void this.finish();
    if (this.#done === 'cancel') void this.cancel();
  }

  progress(progress: number) {
    if (this.#done) return;
    this.#progress = Math.min(1, Math.max(0, progress));
    this.#seek(this.#progress);
  }

  async finish() {
    this.#done = 'finish';
    if (!this.#transition) return this.#attached;
    for (const animation of this.#animations) animation.play();
    await this.#transition.finished.catch(() => {});
  }

  async cancel() {
    this.#done = 'cancel';
    if (!this.#transition) return this.#attached;

    // Scrub back to the start by hand so the animations stay paused: a
    // finished animation would end the transition and reveal the page behind.
    await this.#scrubTo(0);
    // Step forward while the transition still shows the starting page, then drop it.
    await this.#stepForward();
    this.#transition.skipTransition();
    await this.#transition.finished.catch(() => {});
  }

  #stepForward() {
    return this.stepForward();
  }

  #seek(progress: number) {
    for (const animation of this.#animations) {
      const duration = Number((animation.effect as KeyframeEffect | null)?.getComputedTiming().activeDuration ?? 0);
      animation.currentTime = duration * progress;
    }
  }

  #scrubTo(target: number) {
    const from = this.#progress;
    const distance = Math.abs(target - from);
    if (!this.#animations.length || distance === 0) {
      this.#progress = target;
      return Promise.resolve();
    }
    const raf =
      globalThis.requestAnimationFrame?.bind(globalThis) ??
      ((cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16));
    const total = CANCEL_DURATION * distance;
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / total);
        const eased = 1 - (1 - t) * (1 - t);
        this.#progress = from + (target - from) * eased;
        this.#seek(this.#progress);
        if (t < 1) raf(step);
        else resolve();
      };
      raf(step);
    });
  }
}
