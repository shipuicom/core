import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
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
  #ls = inject(LOCALSTORAGE);
  #platformId = inject(PLATFORM_ID);
  #storedDarkMode = this.#ls.getItemParsed<boolean>('darkTheme', true);
  #isDarkMode = signal(false);
  #isMobile = signal(this.window?.innerWidth <= 768);

  isDarkMode = this.#isDarkMode.asReadonly();
  isMobile = this.#isMobile.asReadonly();
  isNavOpen = signal(false);

  constructor(@Inject('Window') private window: Window) {
    if (isPlatformBrowser(this.#platformId)) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme:dark)').matches;

      console.log(prefersDarkMode);
      console.log(this.#storedDarkMode);

      if (prefersDarkMode && this.#storedDarkMode) {
        this.setDarkMode();
      }

      effect(() => {
        if (this.#isDarkMode()) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      });

      window.addEventListener('resize', () => {
        this.#isMobile.set(window.innerWidth <= 768);
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

  setDarkMode() {
    this.#ls.setItemParsed('darkTheme', true, true);
    this.#isDarkMode.set(true);
  }

  setLightMode() {
    this.#ls.setItemParsed('darkTheme', false, true);
    this.#isDarkMode.set(false);
  }
}
