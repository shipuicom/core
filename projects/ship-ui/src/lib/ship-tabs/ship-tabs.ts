import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-tabs',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[style.--tabs-id]': 'id',
  },
})
export class ShipTabs {
  id = '--' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 12);

  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  hostClasses = shipComponentClasses('tabs', {
    color: this.color,
    variant: this.variant,
  });
}
