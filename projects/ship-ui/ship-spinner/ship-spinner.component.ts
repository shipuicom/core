import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor } from '@ship-ui/core';

@Component({
  selector: 'sh-spinner',
  styleUrl: './ship-spinner.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    'role': 'status',
    'aria-busy': 'true',
  },
})
export class ShipSpinner {
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('spinner', {
    color: this.color,
  });
}
