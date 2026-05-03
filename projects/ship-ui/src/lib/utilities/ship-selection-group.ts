import { Directive, ElementRef, HostListener, effect, inject, model, input, booleanAttribute } from '@angular/core';
import { contentProjectionSignal } from './content-projection-signal';

@Directive()
export abstract class ShipSelectionGroup<T = any> {
  protected readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;

  protected items: import('@angular/core').Signal<HTMLElement[]>;

  readonly value = model<T | null>(null);
  readonly closable = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  readonly manualActivation = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  constructor(
    protected readonly itemSelector: string,
    protected readonly activeClass: string,
    protected readonly options?: { hostRole?: string; itemRole?: string }
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
        // If the item doesn't have a value attribute, it's not participate in the selection
        if (itemValue === null && !item.hasAttribute('value')) return;
        
        // Exact match or handle empty string matching properly
        if (itemValue === String(selectedValue) || (itemValue === '' && (selectedValue === null || selectedValue === ''))) {
          item.classList.add(activeClass);
          item.setAttribute('aria-selected', 'true');
          item.setAttribute('tabindex', '0');
        } else {
          item.classList.remove(activeClass);
          item.setAttribute('aria-selected', 'false');
          if (hasSelection) {
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

    if (event.key === 'Enter' || event.key === ' ') {
      const item = targetEl?.closest?.(this.itemSelector) as HTMLElement;
      if (item && this.hostElement.contains(item) && item.hasAttribute('value')) {
        // Only prevent default for space to avoid scrolling, let enter naturally click if it's a link/button
        if (event.key === ' ') event.preventDefault();
        
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

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = activeIndex >= items.length - 1 ? 0 : activeIndex + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        break;
      default:
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
