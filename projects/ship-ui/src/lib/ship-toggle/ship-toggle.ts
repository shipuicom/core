import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-toggle',
  imports: [],
  template: `
    <div class="box">
      <div class="knob"></div>
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipToggle {
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  readonly = input<boolean>(false);

  hostClasses = shipComponentClasses('toggle', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });
}
