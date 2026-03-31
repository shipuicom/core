import { Directive, ElementRef, HostListener, effect, inject, model, input, booleanAttribute } from '@angular/core';
import { contentProjectionSignal } from './content-projection-signal';

@Directive()
export abstract class ShipSelectionGroup<T = any> {
  protected readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;

  protected items: import('@angular/core').Signal<HTMLElement[]>;

  readonly value = model<T | null>(null);
  readonly closable = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  constructor(
    protected readonly itemSelector: string,
    protected readonly activeClass: string
  ) {
    this.items = contentProjectionSignal<HTMLElement>(this.itemSelector, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    effect(() => {
      const selectedValue = this.value();
      const activeClass = this.activeClass;
      this.items().forEach((item) => {
        const itemValue = item.getAttribute('value');
        // If the item doesn't have a value attribute, it's not participate in the selection
        if (itemValue === null && !item.hasAttribute('value')) return;
        
        // Exact match or handle empty string matching properly
        if (itemValue === String(selectedValue) || (itemValue === '' && (selectedValue === null || selectedValue === ''))) {
          item.classList.add(activeClass);
        } else {
          item.classList.remove(activeClass);
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
    const items = this.items().filter(item => item.hasAttribute('value'));
    if (!items.length) return;

    const currentIndex = items.findIndex((item) => item.classList.contains(this.activeClass));
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        break;
      default:
        return; // Let other keys propagate natively
    }

    event.preventDefault();
    const nextItem = items[nextIndex];
    if (nextItem) {
      const value = nextItem.getAttribute('value') as unknown as T;
      this.value.set(value);
      nextItem.focus();
    }
  }
}
