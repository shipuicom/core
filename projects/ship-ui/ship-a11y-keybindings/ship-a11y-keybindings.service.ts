import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { formatShortcut, matchKeybinding, parseKeybinding } from './keybinding-utils';
import { SHIP_A11Y_KEYBINDINGS_OVERRIDE } from './ship-a11y-keybindings-override.token';
import { SHIP_A11Y_KEYBINDINGS_DISABLED } from './ship-a11y-keybindings-disabled.token';

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
  'editor.bold': 'ctrlOrCmd+b',
  'editor.italic': 'ctrlOrCmd+i',
  'editor.underline': 'ctrlOrCmd+u',
  'editor.strike': 'ctrlOrCmd+Shift+x',
  'editor.code': 'ctrlOrCmd+e',
  'editor.link': 'ctrlOrCmd+k',
  'editor.undo': 'ctrlOrCmd+z',
  'editor.redo': 'ctrlOrCmd+y, ctrlOrCmd+Shift+z',

  // Block-level shortcuts (Google Docs / Word standard)
  'editor.paragraph': 'ctrlOrCmd+Alt+Digit0',
  'editor.heading1': 'ctrlOrCmd+Alt+Digit1',
  'editor.heading2': 'ctrlOrCmd+Alt+Digit2',
  'editor.heading3': 'ctrlOrCmd+Alt+Digit3',
  'editor.bulletList': 'ctrlOrCmd+Shift+Digit8',
  'editor.orderedList': 'ctrlOrCmd+Shift+Digit7',
  'editor.blockquote': 'ctrlOrCmd+Shift+Digit9',
  'editor.codeBlock': 'ctrlOrCmd+Shift+c',
  'editor.horizontalRule': 'ctrlOrCmd+Shift+-',
  'editor.removeFormat': 'ctrlOrCmd+\\',

  // Text alignment
  'editor.alignLeft': 'ctrlOrCmd+Shift+l',
  'editor.alignCenter': 'ctrlOrCmd+Shift+e',
  'editor.alignRight': 'ctrlOrCmd+Shift+r',
};

@Injectable({
  providedIn: 'root',
})
export class ShipA11yKeybindingsService {
  #platformId = inject(PLATFORM_ID);
  #overrides = inject(SHIP_A11Y_KEYBINDINGS_OVERRIDE, { optional: true });
  #disabledToken = inject(SHIP_A11Y_KEYBINDINGS_DISABLED, { optional: true });

  #bindings = new Map<string, string>();
  #defaults = new Map<string, string>();

  #pauseCount = 0;
  /** Whether keybinding matching is currently paused (via `pause`/`resume`). */
  isPaused = signal(false);
  /** Whether all keybinding matching is globally disabled. */
  isDisabled = signal(this.#disabledToken ?? false);

  /** True when running in a browser on a Mac, used to map `ctrlOrCmd` to the Cmd key. */
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

  /** Pause keybinding matching; reference-counted so nested pauses require matching `resume` calls. */
  pause(): void {
    this.#pauseCount++;
    this.isPaused.set(true);
  }

  /** Resume keybinding matching once all outstanding `pause` calls have been balanced. */
  resume(): void {
    this.#pauseCount = Math.max(0, this.#pauseCount - 1);
    if (this.#pauseCount === 0) {
      this.isPaused.set(false);
    }
  }

  /** Register default shortcuts for actions, without overriding any already-customised binding. */
  registerDefaults(defaults: Record<string, string>): void {
    for (const [action, shortcut] of Object.entries(defaults)) {
      this.#defaults.set(action, shortcut);

      if (!this.#bindings.has(action)) {
        this.#bindings.set(action, shortcut);
      }
    }
  }

  /** Override the active shortcuts for the given actions, replacing their defaults. */
  registerOverrides(overrides: Record<string, string>): void {
    for (const [action, shortcut] of Object.entries(overrides)) {
      this.#bindings.set(action, shortcut);
    }
  }

  /** Return the currently active shortcut string for an action, if any. */
  getShortcut(action: string): string | undefined {
    return this.#bindings.get(action);
  }

  /** Return the original default shortcut string for an action, ignoring overrides. */
  getDefaultShortcut(action: string): string | undefined {
    return this.#defaults.get(action);
  }

  /** Return a human-readable, platform-aware shortcut label for an action (e.g. for `aria-keyshortcuts`). */
  getDisplayShortcut(action: string): string | undefined {
    const shortcut = this.getShortcut(action);
    if (!shortcut) return undefined;
    return shortcut
      .split(',')
      .map((part) => formatShortcut(part.trim(), this.isMac))
      .join(', ');
  }

  /** Test whether a `KeyboardEvent` matches the active shortcut for an action (always false when disabled). */
  matches(event: KeyboardEvent, action: string): boolean {
    if (this.isDisabled()) return false;

    const shortcut = this.getShortcut(action);
    if (!shortcut) return false;

    return shortcut.split(',').some((part) => {
      const parsed = parseKeybinding(part.trim(), this.isMac);
      return matchKeybinding(event, parsed);
    });
  }
}
