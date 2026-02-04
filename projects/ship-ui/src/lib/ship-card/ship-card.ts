import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipCardVariant, ShipColor } from '../utilities/ship-types';

@Component({
  selector: 'sh-card',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipCard {
  color = input<ShipColor | null>(null);
  variant = input<ShipCardVariant | null>(null);

  hostClasses = shipComponentClasses('card', {
    color: this.color,
    variant: this.variant,
  });
}
