import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipSidenav } from '@ship-ui/core/ship-sidenav';
import { ShipKbd } from '@ship-ui/core/ship-kbd';
import { ShipSpotlightService } from '@ship-ui/core/ship-spotlight';
import { AppConfigService } from '../core/services/app-config.service';
import { LayoutState } from './layout.state';
import { Logo } from './logo/logo';
import { ConfigEditor } from '../config-editor/config-editor';

@Component({
  selector: 'app-layout',
  imports: [
    ShipSidenav,
    ShipList,
    ShipIcon,
    ShipButton,
    ShipKbd,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    Logo,
    ConfigEditor,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Layout {
  #layoutState = inject(LayoutState);
  #router = inject(Router);
  #spotlight = inject(ShipSpotlightService);

  sidenavType = this.#layoutState.sidenavType;
  isNavOpen = this.#layoutState.isNavOpen;
  isMobile = this.#layoutState.isMobile;

  configService = inject(AppConfigService);

  isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');

  constructor() {
    effect(() => {
      const selected = this.#spotlight.globalItemSelected();
      if (selected?.data?.route) {
        this.#router.navigateByUrl(selected.data.route);
      }
    });
  }

  toggleNav() {
    this.#layoutState.toggleNav();
  }

  toggleEditor() {
    this.configService.isEditorOpen.set(!this.configService.isEditorOpen());
  }

  openSearch() {
    const instance = this.#spotlight.open();
    const sub = instance.itemSelected.subscribe((item) => {
      if (item.data?.route) {
        this.#router.navigateByUrl(item.data.route);
      }
    });
    instance.closed.subscribe(() => sub.unsubscribe());
  }
}
