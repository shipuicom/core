import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
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

  isDarkMode = this.#isDarkMode.asReadonly();

  currentWidth = signal(this.#window.innerWidth);
  isNavOpen = signal(true);

  isMobile = computed(() => this.currentWidth() < 1024);
  isMobileEffect = effect(() => {
    console.log(this.isMobile());
    this.isNavOpen.set(!this.isMobile());
  });

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      const prefersDarkMode = this.#window?.matchMedia('(prefers-color-scheme:dark)').matches;

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

      this.#window?.addEventListener('resize', () => {
        this.currentWidth.set(this.#window.innerWidth);
      });
    }
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
