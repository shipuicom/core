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
  #service = inject(ShipA11yKeybindingsService);
  #elementRef = inject(ElementRef<HTMLElement>);
  #renderer = inject(Renderer2);
  #platformId = inject(PLATFORM_ID);

  


  /** Keybinding action id to bind to the host (looked up in `ShipA11yKeybindingsService`). */
  shA11yKeybinding = input.required<string>();

  /** Listen scope: `local` reacts only to key events on the host, `global` listens on `window`. */
  mode = input<'global' | 'local'>('local');

  /** Call `preventDefault()` on the keyboard event when the shortcut matches. */
  preventDefault = input<boolean>(true);

  /** Call `stopPropagation()` on the keyboard event when the shortcut matches. */
  stopPropagation = input<boolean>(true);

  /** Emit the originating `KeyboardEvent` when the bound shortcut is triggered. */
  triggered = output<KeyboardEvent>();

  constructor() {
    
    effect(() => {
      const action = this.shA11yKeybinding();
      const shortcut = this.#service.getShortcut(action);
      if (shortcut) {
        
        const ariaValue = this.#service.getDisplayShortcut(action) || shortcut;
        this.#renderer.setAttribute(this.#elementRef.nativeElement, 'aria-keyshortcuts', ariaValue);
      } else {
        this.#renderer.removeAttribute(this.#elementRef.nativeElement, 'aria-keyshortcuts');
      }
    });

    
    effect((onCleanup) => {
      if (this.mode() === 'global' && isPlatformBrowser(this.#platformId)) {
        const listener = (event: KeyboardEvent) => {
          if (this.#service.isPaused()) {
            return;
          }
          
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

      
      const hostEl = this.#elementRef.nativeElement;
      if (typeof hostEl.click === 'function') {
        hostEl.click();
      }
    }
  }

  


  #isFocusInInput(): boolean {
    const activeEl = document.activeElement;
    if (!activeEl) return false;

    const tagName = activeEl.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const isEditable = activeEl.hasAttribute('contenteditable') && activeEl.getAttribute('contenteditable') !== 'false';

    return isInput || isEditable;
  }
}
