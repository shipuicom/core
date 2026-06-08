import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant } from '@ship-ui/core';

@Component({
  selector: 'sh-event-card',
  styleUrl: './ship-event-card.scss',
  encapsulation: ViewEncapsulation.None,
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
