import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { ServiceSpotlightExample } from './examples/service-spotlight/service-spotlight';

@Component({
  selector: 'app-spotlight-overview',
  imports: [Highlight, Previewer, ServiceSpotlightExample],
  templateUrl: './spotlight-overview.html',
  styleUrl: './spotlight-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightOverview {
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
}
