import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SparkleIconComponent, SparkleTabsComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-tabs',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SparkleTabsComponent, SparkleIconComponent],
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
