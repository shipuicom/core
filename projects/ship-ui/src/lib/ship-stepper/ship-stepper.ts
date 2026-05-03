import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipSelectionGroup } from '../utilities/ship-selection-group';
import { ShipColor } from '../utilities/ship-types';

@Component({
  selector: 'sh-stepper',
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
  }

  hostClasses = shipComponentClasses('stepper', {
    color: this.color,
  });
}
