import { isPlatformServer } from '@angular/common';
import { DOCUMENT, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ShipThemeOption = 'light' | 'dark' | null;

/** localStorage key `ShipThemeState` persists the chosen theme under. */
export const SHIP_THEME_STORAGE_KEY = 'shipTheme';

/**
 * Inline this in `<head>` of your index.html, before the stylesheet, to apply a stored
 * theme before first paint. Without it a saved 'dark'/'light' choice is only applied once
 * Angular bootstraps, so the page briefly renders in the system theme. Apps that only follow
 * the system preference don't need it.
 */
export const SHIP_THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${SHIP_THEME_STORAGE_KEY}');if(t==='dark'||t==='light')document.documentElement.classList.add(t)}catch(e){}`;
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
  // `?? null`: on the server localStorage() is null, so the optional chain yields undefined.
  // undefined fails the `=== null` check in the effect and falls through to the 'light'
  // branch, which stamped class="light" on the prerendered <html> and caused a theme flash.
  #storedDarkMode = (this.localStorage()?.getItem(SHIP_THEME_STORAGE_KEY) ?? null) as ShipThemeOption;
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

  /** Returns the platform `localStorage` (where the theme is persisted), or `null` during server-side rendering. */
  localStorage() {
    if (isPlatformServer(this.#platformId)) return null;

    return this.#window.localStorage;
  }

  /** Advances the theme to the next value in `THEME_ORDER` (light → dark → system) and persists it. */
  toggleTheme() {
    const nextTheme = this.#theme() === null ? THEME_ORDER[0] : THEME_ORDER[THEME_ORDER.indexOf(this.#theme()) + 1];

    this.setTheme(nextTheme);
  }

  /** Sets and persists the theme; passing `null` clears the stored preference and reverts to system default. */
  setTheme(theme: ShipThemeOption) {
    if (theme === null) {
      this.localStorage()?.removeItem(SHIP_THEME_STORAGE_KEY);
      this.#theme.set(null);
      return;
    }

    this.localStorage()?.setItem(SHIP_THEME_STORAGE_KEY, theme);
    this.#theme.set(theme);
  }
}
