import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SHIP_A11Y_KEYBINDINGS_OVERRIDE } from './ship-a11y-keybindings-override.token';
import { parseKeybinding, matchKeybinding, formatShortcut } from './keybinding-utils';

export const DEFAULT_KEYBINDINGS: Record<string, string> = {
  // Datepicker
  'datepicker.prev-month': 'PageUp',
  'datepicker.next-month': 'PageDown',
  'datepicker.prev-year': 'Shift+PageUp',
  'datepicker.next-year': 'Shift+PageDown',
  'datepicker.month-start': 'Home',
  'datepicker.month-end': 'End',
  'datepicker.day-next': 'ArrowRight, d',
  'datepicker.day-prev': 'ArrowLeft, a',
  'datepicker.week-next': 'ArrowDown, s',
  'datepicker.week-prev': 'ArrowUp, w',

  // Selection Group (Tabs, Steppers, Button Groups)
  'selection-group.next': 'ArrowRight, ArrowDown, d, s',
  'selection-group.prev': 'ArrowLeft, ArrowUp, a, w',
  'selection-group.select': 'Enter, space',

  // Select
  'select.next': 'ArrowDown, s',
  'select.prev': 'ArrowUp, w',
  'select.select': 'Enter, space',
  'select.close': 'Escape',

  // Menu
  'menu.next': 'ArrowDown, s',
  'menu.prev': 'ArrowUp, w',
  'menu.open-submenu': 'ArrowRight, d',
  'menu.close-submenu': 'ArrowLeft, a',
  'menu.select': 'Enter, space',

  // Spotlight
  'spotlight.next': 'ArrowDown, s',
  'spotlight.prev': 'ArrowUp, w',
  'spotlight.open': 'ctrlOrCmd+k',

  // Dialog & Popover
  'dialog.close': 'Escape',
  'popover.close': 'Escape',

  // Toggle Card
  'toggle-card.toggle': 'Enter, space',

  // Form Controls
  'checkbox.toggle': 'Enter, space',
  'toggle.toggle': 'Enter, space',
  'radio.select': 'Enter, space',

  // Table
  'table.sort': 'Enter, space',

  // Blueprint
  'blueprint.cancel': 'Escape',

  // Editor Toolbar
  'editor-toolbar.next': 'ArrowRight, ArrowDown',
  'editor-toolbar.prev': 'ArrowLeft, ArrowUp',
  'editor-toolbar.home': 'Home',
  'editor-toolbar.end': 'End',
};

@Injectable({
  providedIn: 'root',
})
export class ShipA11yKeybindingsService {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #overrides = inject(SHIP_A11Y_KEYBINDINGS_OVERRIDE, { optional: true });
  
  // Store of action names to active shortcut strings
  readonly #bindings = new Map<string, string>();
  
  // Store of action names to default shortcut strings
  readonly #defaults = new Map<string, string>();

  /**
   * Returns true if the platform is running on macOS.
   */
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

  /**
   * Registers default shortcuts for actions.
   * If an override already exists for a given action, the override takes precedence.
   */
  registerDefaults(defaults: Record<string, string>): void {
    for (const [action, shortcut] of Object.entries(defaults)) {
      this.#defaults.set(action, shortcut);
      
      // If we don't have an override/binding for this action, set it as the active binding
      if (!this.#bindings.has(action)) {
        this.#bindings.set(action, shortcut);
      }
    }
  }

  /**
   * Registers overrides for actions. Overwrites any existing or default bindings.
   */
  registerOverrides(overrides: Record<string, string>): void {
    for (const [action, shortcut] of Object.entries(overrides)) {
      this.#bindings.set(action, shortcut);
    }
  }

  /**
   * Retrieves the active shortcut string for a registered action.
   */
  getShortcut(action: string): string | undefined {
    return this.#bindings.get(action);
  }

  /**
   * Retrieves the default shortcut string for a registered action.
   */
  getDefaultShortcut(action: string): string | undefined {
    return this.#defaults.get(action);
  }

  /**
   * Gets a formatted, user-friendly shortcut string for display.
   * E.g. 'ctrlOrCmd+Shift+KeyK' -> '⌘⇧K' on macOS, 'Ctrl+Shift+K' on Windows/Linux.
   * Supports comma-separated multiple shortcuts (e.g. 'ArrowRight, d' -> 'ArrowRight, D').
   */
  getDisplayShortcut(action: string): string | undefined {
    const shortcut = this.getShortcut(action);
    if (!shortcut) return undefined;
    return shortcut
      .split(',')
      .map((part) => formatShortcut(part.trim(), this.isMac))
      .join(', ');
  }

  /**
   * Checks if a KeyboardEvent matches the configured keybinding for a given action.
   * Supports comma-separated multiple shortcuts (e.g. 'ArrowRight, d').
   */
  matches(event: KeyboardEvent, action: string): boolean {
    const shortcut = this.getShortcut(action);
    if (!shortcut) return false;
    
    return shortcut.split(',').some((part) => {
      const parsed = parseKeybinding(part.trim(), this.isMac);
      return matchKeybinding(event, parsed);
    });
  }
}
