import { createViewTransition } from './ship-view-transition.types';

// Each animation is its own export so bundlers drop the ones an app never imports.

/** Entering page slides in from the right edge. */
export const slideFromRight = createViewTransition(
  'sh-vt-slide-from-right',
  `from { transform: translateX(100%) } to { transform: none }`
);
/** Entering page slides in from the left edge. */
export const slideFromLeft = createViewTransition(
  'sh-vt-slide-from-left',
  `from { transform: translateX(-100%) } to { transform: none }`
);
/** Entering page slides up from the bottom edge. */
export const slideFromBottom = createViewTransition(
  'sh-vt-slide-from-bottom',
  `from { transform: translateY(100%) } to { transform: none }`
);
/** Entering page slides down from the top edge. */
export const slideFromTop = createViewTransition(
  'sh-vt-slide-from-top',
  `from { transform: translateY(-100%) } to { transform: none }`
);

/** Leaving page slides out through the left edge. */
export const slideToLeft = createViewTransition(
  'sh-vt-slide-to-left',
  `from { transform: none } to { transform: translateX(-100%) }`
);
/** Leaving page slides out through the right edge. */
export const slideToRight = createViewTransition(
  'sh-vt-slide-to-right',
  `from { transform: none } to { transform: translateX(100%) }`
);
/** Leaving page slides out through the bottom edge. */
export const slideToBottom = createViewTransition(
  'sh-vt-slide-to-bottom',
  `from { transform: none } to { transform: translateY(100%) }`
);
/** Leaving page slides out through the top edge. */
export const slideToTop = createViewTransition(
  'sh-vt-slide-to-top',
  `from { transform: none } to { transform: translateY(-100%) }`
);

/** Leaving page recedes a third of the way left and dims, like an iOS push. Pair with `slideFromRight`. */
export const pushBack = createViewTransition(
  'sh-vt-push-back',
  `from { transform: none; opacity: 1 } to { transform: translateX(-30%); opacity: 0.6 }`,
  {
    layer: 'below',
  }
);
/** Entering page comes back from a third of the way left, like an iOS pop. Pair with `slideToRight`. */
export const pullForward = createViewTransition(
  'sh-vt-pull-forward',
  `from { transform: translateX(-30%); opacity: 0.6 } to { transform: none; opacity: 1 }`,
  {
    layer: 'below',
  }
);

/** Entering page fades in. */
export const fadeIn = createViewTransition('sh-vt-fade-in', `from { opacity: 0 } to { opacity: 1 }`);
/** Leaving page fades out. */
export const fadeOut = createViewTransition('sh-vt-fade-out', `from { opacity: 1 } to { opacity: 0 }`);

/** Entering page scales up from 92% while fading in. */
export const scaleIn = createViewTransition(
  'sh-vt-scale-in',
  `from { transform: scale(0.92); opacity: 0 } to { transform: none; opacity: 1 }`
);
/** Leaving page scales down to 92% while fading out. */
export const scaleOut = createViewTransition(
  'sh-vt-scale-out',
  `from { transform: none; opacity: 1 } to { transform: scale(0.92); opacity: 0 }`
);

/** Leaving page shrinks slightly and dims behind an entering page (modal / sheet feel). Pair with `slideFromBottom`. */
export const shrinkBack = createViewTransition(
  'sh-vt-shrink-back',
  `from { transform: none; opacity: 1 } to { transform: scale(0.94); opacity: 0.5 }`,
  {
    layer: 'below',
  }
);
/** Entering page grows back from the shrunken state. Pair with `slideToBottom`. */
export const growForward = createViewTransition(
  'sh-vt-grow-forward',
  `from { transform: scale(0.94); opacity: 0.5 } to { transform: none; opacity: 1 }`,
  {
    layer: 'below',
  }
);

/** Plays nothing; the page is swapped without animating. */
export const none = createViewTransition('none', '');
