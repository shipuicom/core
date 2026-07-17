import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipCardVariant, ShipColor } from '@ship-ui/core';

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
  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`). */
  color = input<ShipColor | null>(null);
  /** Visual variant of the card. */
  variant = input<ShipCardVariant | null>(null);

  hostClasses = shipComponentClasses('card', {
    color: this.color,
    variant: this.variant,
  });
}
