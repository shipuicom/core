import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses, generateUniqueId } from '@ship-ui/core';
import { ShipButtonGroupVariant, ShipSize } from '@ship-ui/core';
import { ShipSelectionGroup } from '@ship-ui/core';

@Component({
  selector: 'sh-button-group',
  styleUrl: './ship-button-group.scss',
  encapsulation: ViewEncapsulation.None,
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
export class ShipButtonGroup extends ShipSelectionGroup<string> {
  id = '--' + generateUniqueId();

  /** Visual variant of the button group. */
  variant = input<ShipButtonGroupVariant | null>(null);
  /** Size preset. */
  size = input<ShipSize | null>(null);

  constructor() {
    super('button', 'active', { hostRole: 'group' });
  }

  hostClasses = shipComponentClasses('buttonGroup', {
    variant: this.variant,
    size: this.size,
  });
}
