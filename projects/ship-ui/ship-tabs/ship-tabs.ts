import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant } from '@ship-ui/core';
import { ShipSelectionGroup } from '@ship-ui/core';

@Component({
  selector: 'sh-tabs',
  styleUrl: './ship-tabs.scss',
  encapsulation: ViewEncapsulation.None,
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
export class ShipTabs extends ShipSelectionGroup<string> {
  id = '--' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 12);

  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  
  constructor() {
    super('[value], [tab], button, a', 'active', { hostRole: 'tablist', itemRole: 'tab' });
  }

  hostClasses = shipComponentClasses('tabs', {
    color: this.color,
    variant: this.variant,
  });
}
