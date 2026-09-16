import {
  fadeIn,
  fadeOut,
  growForward,
  pullForward,
  pushBack,
  shrinkBack,
  slideFromBottom,
  slideFromRight,
  slideToBottom,
  slideToRight,
} from './ship-view-transition.animations';
import { ShipViewTransitionConfig } from './ship-view-transition.types';

/** The iOS navigation-stack feel: push from the right, pop back to the right, with the page underneath receding. */
export const shipIosTransitions: ShipViewTransitionConfig = {
  forward: { in: slideFromRight, out: pushBack },
  back: { in: pullForward, out: slideToRight },
  duration: 350,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
};

/** Pages slide up over the previous one like a sheet and slide back down when leaving. */
export const shipSheetTransitions: ShipViewTransitionConfig = {
  forward: { in: slideFromBottom, out: shrinkBack },
  back: { in: growForward, out: slideToBottom },
  duration: 400,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
};

/** A plain cross-fade in both directions. */
export const shipFadeTransitions: ShipViewTransitionConfig = {
  forward: { in: fadeIn, out: fadeOut },
  duration: 200,
  easing: 'ease',
};
