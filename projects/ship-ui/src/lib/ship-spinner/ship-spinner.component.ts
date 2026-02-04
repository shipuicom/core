import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor } from '../utilities/ship-types';

@Component({
  selector: 'sh-spinner',
  imports: [],
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipSpinner {
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('spinner', {
    color: this.color,
  });
}
