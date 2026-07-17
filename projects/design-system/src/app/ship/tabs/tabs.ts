import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicTab } from './examples/basic-tab/basic-tab';
import { CustomTabsComponent } from './examples/custom-tabs/custom-tabs';
import { DefaultTabsComponent } from './examples/default-tabs/default-tabs';
import { RouterTabsComponent } from './examples/router-tabs/router-tabs';
import { TabsSandbox } from './examples/tabs-sandbox/tabs-sandbox';

@Component({
  selector: 'app-tabs',
  imports: [
    ShipTabs,
    ApiReference,
    RouterOutlet,
    PropertyViewer,
    Previewer,
    BasicTab,
    TabsSandbox,
    DefaultTabsComponent,
    CustomTabsComponent,
    RouterTabsComponent,
  ],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tabs {
  activeTab = signal('overview');
  #router = inject(Router);

  rootUrl = '/app/settings';

  isActive(link: string) {
    return this.#router.url === this.rootUrl + '/' + link;
  }
}
