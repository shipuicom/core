import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicSpotlightExample } from './examples/basic-spotlight/basic-spotlight';
import { ServiceSpotlightExample } from './examples/service-spotlight/service-spotlight';

@Component({
  selector: 'app-spotlight',
  imports: [
    Previewer,
    PropertyViewer,
    BasicSpotlightExample,
    ServiceSpotlightExample,
    ShipTabs,
    Highlight,
  ],
  templateUrl: './spotlight.html',
  styleUrl: './spotlight.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightShowcase {
  activeTab = signal('overview');

  overviewCodeExample = `import { ApplicationConfig } from '@angular/core';
import { provideShipSpotlight } from '@ship-ui/core/ship-spotlight';

export const appConfig: ApplicationConfig = {
  providers: [
    provideShipSpotlight({
      enableGlobalEventListener: true,
      defaultItems: [
        { id: '1', label: 'Dashboard', icon: 'house' },
        { id: '2', label: 'Settings', icon: 'gear' }
      ]
    })
  ]
};

// ... in your component:
import { Component, inject } from '@angular/core';
import { ShipSpotlightService } from '@ship-ui/core/ship-spotlight';

@Component({
  selector: 'my-app',
  template: '<button (click)="openSpotlight()">Search</button>'
})
export class MyApp {
  #spotlight = inject(ShipSpotlightService);

  openSpotlight() {
    this.#spotlight.open({
      placeholder: 'Search anything...'
    });
  }
}`;

  codeStylingExample = `@use '@ship-ui/core/styles' as ship;

// Customizing Spotlight tokens
:root {
  --ship-spotlight-bg: var(--base-11);
  --ship-spotlight-border: var(--base-9);
  --ship-spotlight-text: var(--base-2);
}

// Or override styles directly
.spotlight-dialog {
  border-radius: ship.p2r(12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}`;
}
