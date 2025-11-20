import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipButton, ShipIcon, ShipList, ShipSidenav, ShipThemeToggle } from 'ship-ui';
import { LayoutState } from './layout.state';
import { Logo } from './logo/logo';

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
    ShipThemeToggle,
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

  toggleNav() {
    this.#layoutState.toggleNav();
  }
}
