import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { CustomTabsComponent } from './examples/custom-tabs/custom-tabs';
import { DefaultTabsComponent } from './examples/default-tabs/default-tabs';
import { RouterTabsComponent } from './examples/router-tabs/router-tabs';
import { TabsSandbox } from './examples/tabs-sandbox/tabs-sandbox';

@Component({
  selector: 'app-tabs',
  imports: [
    RouterOutlet,
    PropertyViewer,
    Previewer,
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
  #router = inject(Router);

  rootUrl = '/app/settings';

  isActive(link: string) {
    return this.#router.url === this.rootUrl + '/' + link;
  }
}
