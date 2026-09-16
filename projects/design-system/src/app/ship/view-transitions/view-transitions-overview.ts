import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-view-transitions-overview',
  imports: [PropertyViewer, Highlight],
  templateUrl: './view-transitions-overview.html',
  styleUrl: './view-transitions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ViewTransitionsOverview {
  setupExample = `import { provideRouter } from '@angular/router';
import { provideShipViewTransitions, shipIosTransitions, withShipViewTransitions } from '@ship-ui/core/ship-view-transition';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withShipViewTransitions()),
    provideShipViewTransitions(shipIosTransitions),
  ],
};`;

  outletExample = `<!-- provider defaults -->
<router-outlet shViewTransition />

<!-- mix and match per outlet -->
<router-outlet
  [shViewTransition]="{
    in: slideFromRight,
    out: slideToLeft,
    back: { in: slideFromLeft, out: slideToRight },
    duration: 300
  }" />`;

  configExample = `import { fadeIn, fadeOut, scaleIn, scaleOut } from '@ship-ui/core/ship-view-transition';

provideShipViewTransitions({
  forward: { in: scaleIn, out: fadeOut },
  back: { in: fadeIn, out: scaleOut },
  duration: 250,
  easing: 'ease-out',
  // outlets may also refer to these by name: [shViewTransition]="{ in: 'sh-vt-fade-in' }"
  animations: [fadeIn, fadeOut],
});`;

  customExample = `import { createViewTransition } from '@ship-ui/core/ship-view-transition';

export const wipeIn = createViewTransition('wipe-in', \`
  from { clip-path: inset(0 0 0 100%) }
  to   { clip-path: inset(0) }
\`);

export const dimOut = createViewTransition('dim-out', \`
  to { opacity: 0.4; filter: blur(4px) }
\`, { layer: 'below' });

// <router-outlet [shViewTransition]="{ in: wipeIn, out: dimOut }" />`;

  swipeExample = `<div class="screen">
  <router-outlet shViewTransition swipeBack />
</div>`;

  directionExample = `// Force a direction for one navigation
router.navigate(['/settings'], { info: { shipViewTransition: 'back' } });

// Skip the animation for one navigation
router.navigate(['/login'], { info: { shipViewTransition: false } });

// Never animate into a route (and its children)
{ path: 'admin', loadComponent: ..., data: { shipViewTransition: false } }`;
}
