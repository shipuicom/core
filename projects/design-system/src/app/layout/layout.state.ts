import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { ShipSidenavType } from 'ship-ui';
import { WINDOW } from '../core/providers/window';
import { LOCALSTORAGE } from '../core/services/localstorage.token';

declare global {
  interface Window {
    customData: string;
  }
}

@Injectable({
  providedIn: 'root',
})
export class LayoutState {
  #document = inject(DOCUMENT);
  #window = inject(WINDOW);
  #ls = inject(LOCALSTORAGE);
  #platformId = inject(PLATFORM_ID);

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
    }
  }

  toggleNav() {
    this.isNavOpen.set(!this.isNavOpen());
  }

  closeSidenav() {
    this.isNavOpen.set(false);
  }
}
