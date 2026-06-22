import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { ShipA11yKeybindingsService } from './ship-a11y-keybindings.service';

@Directive({
  selector: '[shA11yKeybinding]',
  standalone: true,
})
export class ShipA11yKeybindingsDirective {
  readonly #service = inject(ShipA11yKeybindingsService);
  readonly #elementRef = inject(ElementRef<HTMLElement>);
  readonly #renderer = inject(Renderer2);
  readonly #platformId = inject(PLATFORM_ID);

  /**
   * The registered action name (e.g. 'table.next-page', 'dialog.close').
   */
  shA11yKeybinding = input.required<string>();

  /**
   * Defines whether the keybinding listener is 'local' (host element keydown) or 'global' (window keydown).
   * Default is 'local'.
   */
  mode = input<'global' | 'local'>('local');

  /**
   * Whether to prevent the default action when the keybinding matches.
   */
  preventDefault = input<boolean>(true);

  /**
   * Whether to stop event propagation when the keybinding matches.
   */
  stopPropagation = input<boolean>(true);

  /**
   * Event emitted when the keybinding is triggered.
   */
  triggered = output<KeyboardEvent>();

  constructor() {
    // Dynamic effect to update aria-keyshortcuts on the host element when binding or service config changes
    effect(() => {
      const action = this.shA11yKeybinding();
      const shortcut = this.#service.getShortcut(action);
      if (shortcut) {
        // Set the standardized shortcut string for screen reader accessibility
        const ariaValue = this.#service.getDisplayShortcut(action) || shortcut;
        this.#renderer.setAttribute(this.#elementRef.nativeElement, 'aria-keyshortcuts', ariaValue);
      } else {
        this.#renderer.removeAttribute(this.#elementRef.nativeElement, 'aria-keyshortcuts');
      }
    });

    // Dynamic effect for global keydown event subscription when mode is 'global'
    effect((onCleanup) => {
      if (this.mode() === 'global' && isPlatformBrowser(this.#platformId)) {
        const listener = (event: KeyboardEvent) => {
          // Avoid firing global hotkeys when typing in editable elements unless modifiers (Ctrl/Cmd/Alt) are pressed
          if (this.#isFocusInInput() && !event.ctrlKey && !event.metaKey && !event.altKey) {
            return;
          }
          this.#checkAndTrigger(event);
        };

        window.addEventListener('keydown', listener);
        onCleanup(() => {
          window.removeEventListener('keydown', listener);
        });
      }
    });
  }

  /**
   * Local keydown listener when mode is 'local'
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.mode() === 'local') {
      this.#checkAndTrigger(event);
    }
  }

  #checkAndTrigger(event: KeyboardEvent): void {
    const action = this.shA11yKeybinding();
    if (this.#service.matches(event, action)) {
      if (this.preventDefault()) {
        event.preventDefault();
      }
      if (this.stopPropagation()) {
        event.stopPropagation();
      }

      this.triggered.emit(event);

      // Declaratively invoke click() on host elements that support it (buttons, anchors, inputs, etc.)
      const hostEl = this.#elementRef.nativeElement;
      if (typeof hostEl.click === 'function') {
        hostEl.click();
      }
    }
  }

  /**
   * Returns true if focus is in a text input or editable element.
   */
  #isFocusInInput(): boolean {
    const activeEl = document.activeElement;
    if (!activeEl) return false;

    const tagName = activeEl.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const isEditable = activeEl.hasAttribute('contenteditable') && activeEl.getAttribute('contenteditable') !== 'false';

    return isInput || isEditable;
  }
}
