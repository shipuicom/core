import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { ShipColor, shipComponentClasses, ShipSelectionGroup } from '@ship-ui/core';

@Component({
  selector: 'sh-stepper',
  styleUrl: './ship-stepper.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipStepper extends ShipSelectionGroup<string> {
  color = input<ShipColor | null>(null);

  constructor() {
    super('[value], [step], [routerLinkActive], button, a', 'active', { hostRole: 'tablist', itemRole: 'tab' });

    const destroyRef = inject(DestroyRef);

    effect(() => {
      this.items().forEach((item) => {
        if (!item.querySelector('.sh-radio')) {
          const shRadio = document.createElement('div');
          shRadio.className = 'sh-radio';

          const shRadioContent = document.createElement('div');
          shRadioContent.className = 'radio sh-sheet';

          shRadio.append(shRadioContent);
          item.prepend(shRadio);
        }
      });
    });

    effect(() => {
      this.items(); // track projected items
      this.updateProgress();
    });

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        this.updateProgress();
      });

      observer.observe(this.hostElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class'],
      });

      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
    }
  }

  updateProgress() {
    const items = Array.from(
      this.hostElement.querySelectorAll('[value], [step], [routerLinkActive], button, a')
    ) as HTMLElement[];
    let activeIndex = items.findIndex((item) => item.classList.contains(this.activeClass));

    if (activeIndex === -1) {
      activeIndex = 0;
    }

    const totalItems = items.length;
    let progress = 0;
    if (totalItems > 1) {
      progress = (activeIndex / (totalItems - 1)) * 100;
    }

    this.hostElement.style.setProperty('--stepper-progress', `${progress}%`);
  }

  hostClasses = shipComponentClasses('stepper', {
    color: this.color,
  });
}
