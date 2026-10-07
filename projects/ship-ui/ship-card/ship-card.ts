import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipCardVariant } from '@ship-ui/core';

@Component({
  selector: 'sh-card',
  styleUrl: './ship-card.scss',
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
export class ShipCard {
  /** Visual variant of the card. */
  variant = input<ShipCardVariant | null>(null);

  hostClasses = shipComponentClasses('card', {
    variant: this.variant,
  });
}
