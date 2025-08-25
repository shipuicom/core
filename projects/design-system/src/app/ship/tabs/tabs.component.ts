import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { CustomTabsComponent } from './examples/custom-tabs/custom-tabs.component';
import { DefaultTabsComponent } from './examples/default-tabs/default-tabs.component';
import { RouterTabsComponent } from './examples/router-tabs/router-tabs.component';
import { TabsSandboxComponent } from './examples/tabs-sandbox/tabs-sandbox.component';

@Component({
  selector: 'app-tabs',
  imports: [
    RouterOutlet,
    PropertyViewerComponent,
    PreviewerComponent,
    TabsSandboxComponent,
    DefaultTabsComponent,
    CustomTabsComponent,
    RouterTabsComponent,
  ],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabsComponent {
  #router = inject(Router);

  rootUrl = '/app/settings';

  isActive(link: string) {
    return this.#router.url === this.rootUrl + '/' + link;
  }
}
