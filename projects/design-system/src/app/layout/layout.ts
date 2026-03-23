import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipButton, ShipIcon, ShipList, ShipSidenav } from 'ship-ui';
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

  sidenavType = this.#layoutState.sidenavType;
  isNavOpen = this.#layoutState.isNavOpen;
  isMobile = this.#layoutState.isMobile;

  configService = inject(AppConfigService);

  toggleNav() {
    this.#layoutState.toggleNav();
  }

  toggleEditor() {
    this.configService.isEditorOpen.set(!this.configService.isEditorOpen());
  }
}
