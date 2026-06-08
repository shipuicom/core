import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ShipSidenavType } from '@ship-ui/core/ship-sidenav';
import { WINDOW } from '../core/providers/window';

declare global {
  interface Window {
    customData: string;
  }
}

@Injectable({
  providedIn: 'root',
})
export class LayoutState {
  #window = inject(WINDOW);
  #platformId = inject(PLATFORM_ID);
  #router = inject(Router);

  currentWidth = signal(this.#window.innerWidth);
  isNavOpen = signal(true);
  sidenavType = signal<ShipSidenavType>('overlay');

  isMobile = computed(() => this.currentWidth() < 1024);
  isMobileEffect = effect(() => {
    this.isNavOpen.set(!this.isMobile());
    this.sidenavType.set(this.isMobile() ? 'overlay' : 'simple');
  });

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      this.#window?.addEventListener('resize', () => {
        this.currentWidth.set(this.#window.innerWidth);
      });

      this.#router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          if (this.isMobile()) {
            this.closeSidenav();
          }
        }
      });
    }
  }

  toggleNav() {
    this.isNavOpen.set(!this.isNavOpen());
  }

  closeSidenav() {
    this.isNavOpen.set(false);
  }
}
