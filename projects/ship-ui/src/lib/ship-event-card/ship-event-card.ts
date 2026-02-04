import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-event-card',
  imports: [],
  template: `
    <div class="content">
      <ng-content />
    </div>

    <div class="actions">
      <ng-content select="[actions]" />
      <ng-content select="button" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
    '[class]': 'hostClasses()',
  },
})
export class ShipEventCard {
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);

  hostClasses = shipComponentClasses('event-card', {
    color: this.color,
    variant: this.variant,
  });
}
