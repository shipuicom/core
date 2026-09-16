/**
 * A single keyframe animation that can play on the leaving (`out`) or entering
 * (`in`) page of a routed view transition. Create one with
 * {@link createViewTransition}; the built-ins are plain instances of this.
 */
export interface ShipViewTransitionAnimation {
  /** CSS `@keyframes` name. Must be unique across registered animations. */
  name: string;
  /** Keyframe body (the part between the braces of `@keyframes name { ... }`). */
  keyframes: string;
  /** Per-animation duration override in milliseconds. */
  duration?: number;
  /** Per-animation timing function override. */
  easing?: string;
  /** Stacking of the snapshot this animation plays on. `above` (default for `in`) draws it over the other page. */
  layer?: 'above' | 'below';
}

/** An animation reference: the animation object itself or the `name` of a registered one. */
export type ShipViewTransitionRef = ShipViewTransitionAnimation | string;

/** The `in` / `out` pair that plays for one navigation direction. */
export interface ShipViewTransitionPair {
  /** Animation for the entering page (`::view-transition-new`). */
  in?: ShipViewTransitionRef;
  /** Animation for the leaving page (`::view-transition-old`). */
  out?: ShipViewTransitionRef;
}

/**
 * Per-outlet transition spec accepted by the `shViewTransition` directive.
 * Anything left out falls back to the provider config.
 */
export interface ShipViewTransitionSpec extends ShipViewTransitionPair {
  /** Pair to play on back navigation (browser back, or `info: { shipViewTransition: 'back' }`). */
  back?: ShipViewTransitionPair;
  /** Duration in ms for both pages. */
  duration?: number;
  /** Timing function for both pages. */
  easing?: string;
}

/** Config for {@link provideShipViewTransitions}. Presets such as `shipIosTransitions` are instances of this. */
export interface ShipViewTransitionConfig {
  /** Default pair for forward navigation. */
  forward: ShipViewTransitionPair;
  /** Default pair for back navigation. Falls back to `forward` when omitted. */
  back?: ShipViewTransitionPair;
  /** Default duration in ms. Defaults to 350. */
  duration?: number;
  /** Default timing function. Defaults to an iOS-like ease-out curve. */
  easing?: string;
  /** Animations that outlets may reference by name. Only what is listed here (plus what the pairs use) ends up in the bundle. */
  animations?: ShipViewTransitionAnimation[];
  /** Skip the animation entirely when the user prefers reduced motion. Defaults to `true`. */
  respectReducedMotion?: boolean;
}

export type ShipViewTransitionDirection = 'forward' | 'back';

/**
 * Value for the `info` navigation extra to steer a single navigation, e.g.
 * `router.navigate(['/settings'], { info: { shipViewTransition: 'back' } })`.
 */
export interface ShipViewTransitionNavigationInfo {
  shipViewTransition?: ShipViewTransitionDirection | false;
}

/**
 * Creates a view transition animation. The keyframes are injected into the
 * document the first time an outlet uses the animation, so unused ones cost nothing.
 *
 * ```ts
 * export const wipe = createViewTransition('my-wipe', `
 *   from { clip-path: inset(0 100% 0 0) }
 *   to   { clip-path: inset(0) }
 * `);
 * ```
 */
export function createViewTransition(
  name: string,
  keyframes: string,
  options: Pick<ShipViewTransitionAnimation, 'duration' | 'easing' | 'layer'> = {}
): ShipViewTransitionAnimation {
  return { name, keyframes, ...options };
}
