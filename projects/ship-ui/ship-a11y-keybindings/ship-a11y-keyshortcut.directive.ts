import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { ShipA11yKeybindingsService } from './ship-a11y-keybindings.service';

@Directive({
  selector: '[shA11yKeyshortcut]',
  standalone: true,
})
export class ShipA11yKeyshortcutDirective {
  readonly #service = inject(ShipA11yKeybindingsService);
  readonly #elementRef = inject(ElementRef<HTMLElement>);
  readonly #renderer = inject(Renderer2);

  /**
   * The registered action name (e.g. 'table.sort', 'select.close') to fetch the shortcut for.
   * This will update the host element's `aria-keyshortcuts` attribute dynamically.
   */
  shA11yKeyshortcut = input.required<string>();

  constructor() {
    effect(() => {
      const action = this.shA11yKeyshortcut();
      const shortcut = this.#service.getShortcut(action);
      if (shortcut) {
        const ariaValue = this.#service.getDisplayShortcut(action) || shortcut;
        this.#renderer.setAttribute(this.#elementRef.nativeElement, 'aria-keyshortcuts', ariaValue);
      } else {
        this.#renderer.removeAttribute(this.#elementRef.nativeElement, 'aria-keyshortcuts');
      }
    });
  }
}
