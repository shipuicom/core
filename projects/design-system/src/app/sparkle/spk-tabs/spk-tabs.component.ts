import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { DefaultTabsComponent } from './examples/default-tabs/default-tabs.component';
import { RouterTabsComponent } from './examples/router-tabs/router-tabs.component';
import { TabsSandboxComponent } from './examples/tabs-sandbox/tabs-sandbox.component';

@Component({
  selector: 'app-spk-tabs',
  imports: [
    RouterOutlet,
    PropertyViewerComponent,
    PreviewerComponent,
    TabsSandboxComponent,
    DefaultTabsComponent,
    RouterTabsComponent,
  ],
  templateUrl: './spk-tabs.component.html',
  styleUrl: './spk-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTabsComponent {
  #router = inject(Router);

  rootUrl = '/app/settings';

  isActive(link: string) {
    return this.#router.url === this.rootUrl + '/' + link;
  }
}
