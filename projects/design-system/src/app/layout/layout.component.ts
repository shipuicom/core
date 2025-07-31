import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ShipButtonComponent,
  ShipIconComponent,
  ShipListComponent,
  ShipSidenavComponent,
  ShipSidenavType,
} from '../../../../ship-ui/src/public-api';
import { LayoutState } from './layout.state';

@Component({
  selector: 'app-layout',
  imports: [
    ShipSidenavComponent,
    ShipListComponent,
    ShipIconComponent,
    ShipButtonComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutComponent {
  #layoutState = inject(LayoutState);

  sidenavType = signal<ShipSidenavType>('simple');
  isOpen = signal(false);
  isNavOpen = this.#layoutState.isNavOpen;
  isDarkMode = this.#layoutState.isDarkMode;

  toggleBodyClass() {
    this.#layoutState.toggleBodyClass();
  }

  toggleNav() {
    this.#layoutState.toggleNav();
  }

  toggleSidenavType(type: ShipSidenavType) {
    this.sidenavType.set(type);
    this.#layoutState.closeSidenav();
  }
}
