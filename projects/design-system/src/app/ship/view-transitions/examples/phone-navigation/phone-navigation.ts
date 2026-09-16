import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import {
  createViewTransition,
  fadeIn,
  fadeOut,
  growForward,
  ShipViewTransition,
  ShipViewTransitionSpec,
  shrinkBack,
  slideFromBottom,
  slideFromLeft,
  slideFromRight,
  slideToBottom,
  slideToLeft,
  slideToRight,
} from '@ship-ui/core/ship-view-transition';

// A custom animation made with the same helper the built-ins use.
const wipeIn = createViewTransition('demo-wipe-in', `from { clip-path: inset(0 0 0 100%) } to { clip-path: inset(0) }`);
const dimOut = createViewTransition('demo-dim-out', `to { opacity: 0.35; filter: blur(6px) }`, { layer: 'below' });

const STYLES: Record<string, ShipViewTransitionSpec | null> = {
  // null = whatever provideShipViewTransitions() was given (shipIosTransitions here)
  ios: null,
  tabs: { in: slideFromRight, out: slideToLeft, back: { in: slideFromLeft, out: slideToRight }, duration: 300 },
  sheet: { in: slideFromBottom, out: shrinkBack, back: { in: growForward, out: slideToBottom }, duration: 400 },
  fade: { in: fadeIn, out: fadeOut, duration: 200, easing: 'ease' },
  custom: { in: wipeIn, out: dimOut, back: { in: fadeIn, out: slideToRight }, duration: 450 },
};

@Component({
  selector: 'app-phone-navigation',
  imports: [ShipTabs, ShipIcon, RouterLink, RouterLinkActive, RouterOutlet, ShipViewTransition],
  templateUrl: './phone-navigation.html',
  styleUrl: './phone-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneNavigation {
  style = signal('ios');
  spec = computed(() => STYLES[this.style()] ?? null);
}
