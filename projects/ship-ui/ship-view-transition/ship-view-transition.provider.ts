import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ViewTransitionInfo, ViewTransitionsFeature, withViewTransitions } from '@angular/router';
import { SHIP_VIEW_TRANSITIONS_CONFIG, ShipViewTransitions } from './ship-view-transition.service';
import { ShipViewTransitionConfig } from './ship-view-transition.types';

/**
 * Provides the transition defaults and the animation registry.
 *
 * The default pair is required so that no keyframes are bundled unless you
 * ask for them: pass a preset (`shipIosTransitions`) or your own config.
 *
 * ```ts
 * provideRouter(routes, withShipViewTransitions()),
 * provideShipViewTransitions(shipIosTransitions),
 * ```
 */
export function provideShipViewTransitions(config: ShipViewTransitionConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SHIP_VIEW_TRANSITIONS_CONFIG, useValue: config }, ShipViewTransitions]);
}

/**
 * Router feature that wraps navigations in `document.startViewTransition()`
 * and hands each transition to {@link ShipViewTransitions}. Pass it to
 * `provideRouter` next to {@link provideShipViewTransitions}.
 */
export function withShipViewTransitions(options: { skipInitialTransition?: boolean } = {}): ViewTransitionsFeature {
  return withViewTransitions({
    skipInitialTransition: options.skipInitialTransition ?? true,
    onViewTransitionCreated: (info: ViewTransitionInfo) => inject(ShipViewTransitions).onCreated(info),
  });
}
