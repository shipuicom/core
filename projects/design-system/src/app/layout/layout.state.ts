import { Injectable, PLATFORM_ID, afterRenderEffect, effect, inject, signal } from '@angular/core';
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
  #window = inject(WINDOW);
  #ls = inject(LOCALSTORAGE);
  #platformId = inject(PLATFORM_ID);
  #storedDarkMode = this.#ls.getItemParsed<boolean>('darkTheme', true);
  #isDarkMode = signal(false);
  #isMobile = signal(this.#window?.innerWidth <= 768);

  isDarkMode = this.#isDarkMode.asReadonly();
  isMobile = this.#isMobile.asReadonly();
  isNavOpen = signal(true);

  constructor() {
    afterRenderEffect(() => {
      const prefersDarkMode = window?.matchMedia('(prefers-color-scheme:dark)').matches;

      if (prefersDarkMode && this.#storedDarkMode) {
        this.setDarkMode();
      }

      effect(() => {
        if (this.#isDarkMode()) {
          document.body.classList.add('dark');
          // document.body.classList.remove('light');
        } else {
          document.body.classList.remove('dark');
          // document.body.classList.add('light');
        }
      });

      window?.addEventListener('resize', () => {
        this.#isMobile.set(window?.innerWidth <= 768);
      });
    });
  }

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
