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
  #storedDarkMode = this.#ls.getItemParsed<boolean>('darkTheme', true);
  #isDarkMode = signal(this.#storedDarkMode);

  isDarkMode = this.#isDarkMode.asReadonly();

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

  darkModeEffect = effect(() => {
    if (this.#isDarkMode()) {
      this.#document.documentElement.classList.add('dark');
      this.#document.documentElement.classList.remove('light');
    } else {
      this.#document.documentElement.classList.remove('dark');
      this.#document.documentElement.classList.add('light');
    }
  });

  toggleNav() {
    this.isNavOpen.set(!this.isNavOpen());
  }

  toggleBodyClass() {
    this.#ls.setItemParsed('darkTheme', !this.isDarkMode(), true);
    this.#isDarkMode.set(!this.isDarkMode());
  }

  closeSidenav() {
    this.isNavOpen.set(false);
  }

  setDarkMode() {
    this.#ls.setItemParsed('darkTheme', true, true);
    this.#isDarkMode.set(true);
  }

  setLightMode() {
    this.#ls.setItemParsed('darkTheme', false, true);
    this.#isDarkMode.set(false);
  }
}
