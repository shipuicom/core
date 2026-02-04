import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipButtonGroupVariant, ShipColor, ShipSize } from '../utilities/ship-types';

@Component({
  selector: 'sh-button-group',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[style.--btng-id]': 'id',
  },
})
export class ShipButtonGroup {
  id = '--' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 12);

  color = input<ShipColor | null>(null);
  variant = input<ShipButtonGroupVariant | null>(null);
  size = input<ShipSize | null>(null);

  hostClasses = shipComponentClasses('buttonGroup', {
    color: this.color,
    variant: this.variant,
    size: this.size,
  });
}
