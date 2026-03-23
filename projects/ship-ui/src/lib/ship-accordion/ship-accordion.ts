import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { contentProjectionSignal } from '../utilities/content-projection-signal';
import { shipComponentClasses } from '../utilities/ship-component';

@Component({
  selector: 'sh-accordion',
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sh-accordion]': 'true',
    '[class]': 'hostClasses()',
  },
})
export class ShipAccordion {
  private selfElement = inject(ElementRef<HTMLElement>).nativeElement;

  readonly name = input<string>(`sh-accordion-${Math.random().toString(36).substring(2, 9)}`);
  readonly value = model<string | null>(null);
  readonly allowMultiple = input<boolean>(false);
  readonly variant = input<'base' | 'outlined' | 'flat' | null>(null);
  readonly size = input<string | null>(null);

  hostClasses = shipComponentClasses('accordion', {
    variant: this.variant,
    size: this.size,
  });

  protected items = contentProjectionSignal<HTMLDetailsElement>('details', {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open', 'value'],
  });

  constructor() {
    this.selfElement.addEventListener('toggle', this.onToggle.bind(this), true);

    effect(() => {
      const isMultiple = this.allowMultiple();
      const groupName = this.name();
      const valStr = this.value();
      const vals = valStr ? valStr.split(',').filter((v) => v !== '') : [];

      this.items().forEach((details) => {
        if (!isMultiple) {
          details.setAttribute('name', groupName);
        } else {
          details.removeAttribute('name');
        }

        const summary = details.querySelector('summary');
        if (summary && !summary.querySelector('sh-icon')) {
          const icon = document.createElement('sh-icon');
          icon.textContent = 'caret-down';
          summary.appendChild(icon);
        }

        let contentWrapper = details.querySelector(':scope > .content');

        if (!contentWrapper) {
          const newWrapper = document.createElement('div');
          newWrapper.className = 'content';
          const childrenToMove = Array.from(details.childNodes).filter((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).tagName.toLowerCase() === 'summary'
            ) {
              return false;
            }
            return true;
          });
          childrenToMove.forEach((child) => newWrapper.appendChild(child));
          details.appendChild(newWrapper);
          contentWrapper = newWrapper;
        }

        const itemVal = details.getAttribute('value');
        if (itemVal && vals.includes(itemVal)) {
          // Avoid triggering endless loops by only setting open if it actually changed
          if (!details.open) details.open = true;
        } else if (itemVal) {
          if (details.open) details.open = false;
        }
      });
    });
  }

  onToggle(event: Event) {
    const target = event.target as HTMLDetailsElement;
    if (target.tagName !== 'DETAILS') return;
    if (!this.selfElement.contains(target)) return;

    const itemVal = target.getAttribute('value');
    if (!itemVal) return; // Uncontrolled details element

    const isOpen = target.open;

    if (this.allowMultiple()) {
      let vals = this.value()
        ? this.value()!
            .split(',')
            .filter((v) => v !== '')
        : [];
      if (isOpen && !vals.includes(itemVal)) vals.push(itemVal);
      if (!isOpen) vals = vals.filter((v) => v !== itemVal);
      this.value.set(vals.join(','));
    } else {
      if (isOpen) {
        this.value.set(itemVal);
      } else {
        if (this.value() === itemVal) {
          this.value.set(null);
        }
      }
    }
  }
}
