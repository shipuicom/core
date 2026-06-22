import { Directive, ElementRef, HostListener, effect, inject, model, input, booleanAttribute } from '@angular/core';
import { contentProjectionSignal } from './content-projection-signal';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';

@Directive()
export abstract class ShipSelectionGroup<T = any> {
  protected readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;
  readonly #keybindings = inject(ShipA11yKeybindingsService);

  protected items: import('@angular/core').Signal<HTMLElement[]>;

  readonly value = model<T | null>(null);
  readonly closable = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  readonly manualActivation = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  constructor(
    protected readonly itemSelector: string,
    protected readonly activeClass: string,
    protected readonly options?: {
      hostRole?: string;
      itemRole?: string;
      activeAttribute?: 'aria-selected' | 'aria-pressed' | 'aria-checked';
    }
  ) {
    if (this.options?.hostRole) {
      this.hostElement.setAttribute('role', this.options.hostRole);
    }

    this.items = contentProjectionSignal<HTMLElement>(this.itemSelector, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    effect(() => {
      const selectedValue = this.value();
      const activeClass = this.activeClass;
      const items = this.items();
      const activeAttr = this.options?.activeAttribute || 
        (this.options?.itemRole === 'tab' || this.options?.itemRole === 'option' ? 'aria-selected' : 
         this.options?.itemRole === 'radio' ? 'aria-checked' : 
         'aria-pressed');
      
      let hasSelection = false;
      items.forEach((item) => {
        const itemValue = item.getAttribute('value');
        if (itemValue === null && !item.hasAttribute('value')) return;
        if (itemValue === String(selectedValue) || (itemValue === '' && (selectedValue === null || selectedValue === ''))) {
          hasSelection = true;
        }
      });

      items.forEach((item) => {
        if (this.options?.itemRole && !item.hasAttribute('role')) {
          item.setAttribute('role', this.options.itemRole);
        }

        const itemValue = item.getAttribute('value');
        const hasValueAttr = itemValue !== null || item.hasAttribute('value');
        
        let isSelected = false;
        if (hasValueAttr) {
          isSelected = itemValue === String(selectedValue) || (itemValue === '' && (selectedValue === null || selectedValue === ''));
        } else {
          isSelected = item.classList.contains(activeClass);
        }
        
        if (isSelected) {
          if (hasValueAttr) {
            item.classList.add(activeClass);
          }
          item.setAttribute(activeAttr, 'true');
          item.setAttribute('tabindex', '0');
        } else {
          if (hasValueAttr) {
            item.classList.remove(activeClass);
          }
          item.setAttribute(activeAttr, 'false');
          if (hasSelection || !hasValueAttr) {
            item.setAttribute('tabindex', '-1');
          } else {
            item.removeAttribute('tabindex');
          }
        }
      });
    });
  }

  @HostListener('click', ['$event.target'])
  protected onClick(target: EventTarget | null) {
    const targetEl = target as HTMLElement;
    if (!targetEl || !targetEl.closest) return;
    const item = targetEl.closest(this.itemSelector) as HTMLElement;
    if (item && this.hostElement.contains(item)) {
      if (item.hasAttribute('value')) {
        const value = item.getAttribute('value') as unknown as T;
        if (this.closable() && String(this.value()) === String(value)) {
          this.value.set(null);
        } else {
          this.value.set(value);
        }
      }
    }
  }

  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent) {
    const targetEl = event.target as HTMLElement;

    if (this.#keybindings.matches(event, 'selection-group.select')) {
      const item = targetEl?.closest?.(this.itemSelector) as HTMLElement;
      if (item && this.hostElement.contains(item) && item.hasAttribute('value')) {
        // Only prevent default for space to avoid scrolling, let enter naturally click if it's a link/button
        const isSpace = event.key === ' ' || event.key === 'Spacebar';
        if (isSpace) event.preventDefault();
        
        const value = item.getAttribute('value') as unknown as T;
        if (this.closable() && String(this.value()) === String(value)) {
          this.value.set(null);
        } else {
          this.value.set(value);
        }
      }
      return;
    }

    const items = this.items().filter(item => item.hasAttribute('value'));
    if (!items.length) return;

    let activeIndex = items.findIndex((item) => item === document.activeElement || item.contains(document.activeElement as Node));
    if (activeIndex === -1) {
      activeIndex = items.findIndex((item) => item.classList.contains(this.activeClass));
    }
    if (activeIndex === -1) activeIndex = 0;

    let nextIndex = activeIndex;

    if (this.#keybindings.matches(event, 'selection-group.next')) {
      nextIndex = activeIndex >= items.length - 1 ? 0 : activeIndex + 1;
    } else if (this.#keybindings.matches(event, 'selection-group.prev')) {
      nextIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
    } else {
      return; // Let other keys propagate natively
    }

    event.preventDefault();
    const nextItem = items[nextIndex];
    if (nextItem) {
      if (!this.manualActivation()) {
        const value = nextItem.getAttribute('value') as unknown as T;
        this.value.set(value);
      }
      nextItem.focus();
    }
  }
}
