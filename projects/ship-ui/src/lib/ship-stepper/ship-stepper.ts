import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
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
export class ShipStepper {
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('stepper', {
    color: this.color,
  });
}
