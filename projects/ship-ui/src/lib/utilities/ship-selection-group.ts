import { Directive, ElementRef, HostListener, effect, inject, model, input, booleanAttribute } from '@angular/core';
import { contentProjectionSignal } from './content-projection-signal';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';

@Directive()
export abstract class ShipSelectionGroup<T = any> {
  hostElement = inject(ElementRef<HTMLElement>).nativeElement;
  #keybindings = inject(ShipA11yKeybindingsService);

  items: import('@angular/core').Signal<HTMLElement[]>;

  value = model<T | null>(null);
  closable = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  manualActivation = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  itemSelector: string;
  activeClass: string;
  options?: {
    hostRole?: string;
    itemRole?: string;
    activeAttribute?: 'aria-selected' | 'aria-pressed' | 'aria-checked';
  };

  constructor(
    itemSelector: string,
    activeClass: string,
    options?: {
      hostRole?: string;
      itemRole?: string;
      activeAttribute?: 'aria-selected' | 'aria-pressed' | 'aria-checked';
    }
  ) {
    this.itemSelector = itemSelector;
    this.activeClass = activeClass;
    this.options = options;
    if (this.options?.hostRole) {
      this.hostElement.setAttribute('role', this.options.hostRole);
    }

    this.items = contentProjectionSignal<HTMLElement>(this.itemSelector, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    effect(() => {
      if (!this.selectionEnabled()) return;

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

        // ARIA APG: the group is a single tab stop. Interactive descendants
        // inside an item (checkbox inputs, buttons, links) must not add their
        // own tab stops — the item itself carries focus and state.
        item
          .querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
          .forEach((focusable) => focusable.setAttribute('tabindex', '-1'));
      });

      // With no current selection there is no tabindex="0" roving anchor, so
      // the first selectable item becomes the group's tab stop.
      if (!hasSelection) {
        const selectable = items.filter((item) => item.hasAttribute('value') || item.hasAttribute('routerlink') || item.hasAttribute('href'));
        selectable.forEach((item, index) => item.setAttribute('tabindex', index === 0 ? '0' : '-1'));
      }
    });
  }

  /**
   * Hook for subclasses that make selection opt-in (e.g. `sh-list`): when this
   * returns `false` the group leaves projected content untouched — no role,
   * aria, or tabindex stamping and no click/keyboard selection handling.
   */
  protected selectionEnabled(): boolean {
    return true;
  }

  @HostListener('click', ['$event.target'])
  onClick(target: EventTarget | null) {
    if (!this.selectionEnabled()) return;

    const targetEl = target as HTMLElement;
    if (!targetEl) return;
    // Resolve via the tracked items rather than targetEl.closest(): closest()
    // re-binds :scope to the target element, breaking direct-child selectors.
    const item = this.items().find((candidate) => candidate === targetEl || candidate.contains(targetEl));
    if (item) {
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
  onKeyDown(event: KeyboardEvent) {
    if (!this.selectionEnabled()) return;

    const targetEl = event.target as HTMLElement;

    if (this.#keybindings.matches(event, 'selection-group.select')) {
      const item = this.items().find((candidate) => candidate === targetEl || candidate.contains(targetEl));
      if (item && item.hasAttribute('value')) {
        
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

    // Link items (routerLink/href without a value) participate in roving
    // focus too — activation happens through their own click navigation.
    const items = this.items().filter(
      (item) => item.hasAttribute('value') || item.hasAttribute('routerlink') || item.hasAttribute('href')
    );
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
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextItem = items[nextIndex];
    if (nextItem) {
      if (!this.manualActivation()) {
        if (nextItem.hasAttribute('value')) {
          const value = nextItem.getAttribute('value') as unknown as T;
          this.value.set(value);
        } else {
          nextItem.click();
        }
      }
      nextItem.focus();
    }
  }
}
