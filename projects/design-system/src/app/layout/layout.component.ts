import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipButton, ShipIcon, ShipList, ShipSidenavComponent } from '../../../../ship-ui/src/public-api';
import { LayoutState } from './layout.state';
import { LogoComponent } from './logo/logo.component';

@Component({
  selector: 'app-layout',
  imports: [
    ShipSidenavComponent,
    ShipList,
    ShipIcon,
    ShipButton,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LogoComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutComponent {
  #layoutState = inject(LayoutState);

  sidenavType = this.#layoutState.sidenavType;
  isNavOpen = this.#layoutState.isNavOpen;
  isDarkMode = this.#layoutState.isDarkMode;
  isMobile = this.#layoutState.isMobile;

  toggleBodyClass() {
    this.#layoutState.toggleBodyClass();
  }

  toggleNav() {
    this.#layoutState.toggleNav();
  }
}
