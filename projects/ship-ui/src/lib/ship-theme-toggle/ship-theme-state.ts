import { isPlatformServer } from '@angular/common';
import { DOCUMENT, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ShipThemeOption = 'light' | 'dark' | null;
export const THEME_ORDER: ShipThemeOption[] = ['light', 'dark', null];

import { InjectionToken } from '@angular/core';

export const WINDOW = new InjectionToken<Window>('WindowToken', {
  providedIn: 'root',
  factory: () => (typeof window !== 'undefined' ? window : ({} as Window)),
});

@Injectable({
  providedIn: 'root',
})
export class ShipThemeState {
  #document = inject(DOCUMENT);
  #window = inject(WINDOW);
  #platformId = inject(PLATFORM_ID);
  #storedDarkMode = this.localStorage()?.getItem('shipTheme') as ShipThemeOption;
  #theme = signal<ShipThemeOption>(this.#storedDarkMode);

  theme = this.#theme.asReadonly();

  darkModeEffect = effect(() => {
    const theme = this.#theme();

    if (theme === null) {
      this.#document.documentElement.classList.remove('dark');
      this.#document.documentElement.classList.remove('light');
      return;
    }

    if (theme === 'dark') {
      this.#document.documentElement.classList.add('dark');
      this.#document.documentElement.classList.remove('light');
    } else {
      this.#document.documentElement.classList.add('light');
      this.#document.documentElement.classList.remove('dark');
    }
  });

  localStorage() {
    if (isPlatformServer(this.#platformId)) return null;

    return this.#window.localStorage;
  }

  toggleTheme() {
    const nextTheme = this.#theme() === null ? THEME_ORDER[0] : THEME_ORDER[THEME_ORDER.indexOf(this.#theme()) + 1];

    this.setTheme(nextTheme);
  }

  setTheme(theme: ShipThemeOption) {
    if (theme === null) {
      this.localStorage()?.removeItem('shipTheme');
      this.#theme.set(null);
      return;
    }

    this.localStorage()?.setItem('shipTheme', theme);
    this.#theme.set(theme);
  }
}
