import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipButtonGroupVariant, ShipColor, ShipSize } from '@ship-ui/core';
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
  id = '--' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 12);

  color = input<ShipColor | null>(null);
  variant = input<ShipButtonGroupVariant | null>(null);
  size = input<ShipSize | null>(null);

  constructor() {
    super('button', 'active', { hostRole: 'group' });
  }

  hostClasses = shipComponentClasses('buttonGroup', {
    color: this.color,
    variant: this.variant,
    size: this.size,
  });
}
