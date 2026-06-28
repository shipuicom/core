import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { formatShortcut, matchKeybinding, parseKeybinding } from './keybinding-utils';
import { SHIP_A11Y_KEYBINDINGS_OVERRIDE } from './ship-a11y-keybindings-override.token';

export const DEFAULT_KEYBINDINGS: Record<string, string> = {
  'datepicker.prev-month': 'PageUp',
  'datepicker.next-month': 'PageDown',
  'datepicker.prev-year': 'Shift+PageUp',
  'datepicker.next-year': 'Shift+PageDown',
  'datepicker.month-start': 'Home',
  'datepicker.month-end': 'End',
  'datepicker.day-next': 'ArrowRight',
  'datepicker.day-prev': 'ArrowLeft',
  'datepicker.week-next': 'ArrowDown',
  'datepicker.week-prev': 'ArrowUp',

  'selection-group.next': 'ArrowRight, ArrowDown',
  'selection-group.prev': 'ArrowLeft, ArrowUp',
  'selection-group.select': 'Enter, space',

  'select.next': 'ArrowDown',
  'select.prev': 'ArrowUp',
  'select.select': 'Enter, space',
  'select.close': 'Escape',

  'menu.next': 'ArrowDown',
  'menu.prev': 'ArrowUp',
  'menu.open-submenu': 'ArrowRight',
  'menu.close-submenu': 'ArrowLeft',
  'menu.select': 'Enter, space',

  'spotlight.next': 'ArrowDown',
  'spotlight.prev': 'ArrowUp',
  'spotlight.open': 'ctrlOrCmd+k',

  'dialog.close': 'Escape',
  'popover.close': 'Escape',

  'toggle-card.toggle': 'Enter, space',

  'checkbox.toggle': 'Enter, space',
  'toggle.toggle': 'Enter, space',
  'radio.select': 'Enter, space',

  'table.sort': 'Enter, space',
  'table.column-resize-decrease': 'Shift+ArrowLeft',
  'table.column-resize-increase': 'Shift+ArrowRight',

  'grid.focus-up': 'ArrowUp',
  'grid.focus-down': 'ArrowDown',
  'grid.focus-left': 'ArrowLeft',
  'grid.focus-right': 'ArrowRight',
  'grid.focus-first': 'Home',
  'grid.focus-last': 'End',

  'blueprint.cancel': 'Escape',

  'editor-toolbar.next': 'ArrowRight, ArrowDown',
  'editor-toolbar.prev': 'ArrowLeft, ArrowUp',
  'editor-toolbar.home': 'Home',
  'editor-toolbar.end': 'End',
};

@Injectable({
  providedIn: 'root',
})
export class ShipA11yKeybindingsService {
  #platformId = inject(PLATFORM_ID);
  #overrides = inject(SHIP_A11Y_KEYBINDINGS_OVERRIDE, { optional: true });

  #bindings = new Map<string, string>();

  #defaults = new Map<string, string>();

  get isMac(): boolean {
    if (!isPlatformBrowser(this.#platformId)) return false;
    return navigator.userAgent.toLowerCase().includes('mac');
  }

  constructor() {
    this.registerDefaults(DEFAULT_KEYBINDINGS);
    if (this.#overrides) {
      this.registerOverrides(this.#overrides);
    }
  }

  registerDefaults(defaults: Record<string, string>): void {
    for (const [action, shortcut] of Object.entries(defaults)) {
      this.#defaults.set(action, shortcut);

      if (!this.#bindings.has(action)) {
        this.#bindings.set(action, shortcut);
      }
    }
  }

  registerOverrides(overrides: Record<string, string>): void {
    for (const [action, shortcut] of Object.entries(overrides)) {
      this.#bindings.set(action, shortcut);
    }
  }

  getShortcut(action: string): string | undefined {
    return this.#bindings.get(action);
  }

  getDefaultShortcut(action: string): string | undefined {
    return this.#defaults.get(action);
  }

  getDisplayShortcut(action: string): string | undefined {
    const shortcut = this.getShortcut(action);
    if (!shortcut) return undefined;
    return shortcut
      .split(',')
      .map((part) => formatShortcut(part.trim(), this.isMac))
      .join(', ');
  }

  matches(event: KeyboardEvent, action: string): boolean {
    const shortcut = this.getShortcut(action);
    if (!shortcut) return false;

    return shortcut.split(',').some((part) => {
      const parsed = parseKeybinding(part.trim(), this.isMac);
      return matchKeybinding(event, parsed);
    });
  }
}
