import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipIcon } from '../ship-icon/ship-icon';
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-checkbox',
  imports: [ShipIcon],
  template: `
    <div class="box sh-sheet" [class]="currentClassList()">
      <sh-icon class="inherit default-indicator">check-bold</sh-icon>
      <sh-icon class="inherit indeterminate-indicator">minus-bold</sh-icon>
    </div>

    <div class="label">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipCheckbox {
  currentClassList = classMutationSignal();
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  readonly = input<boolean>(false);

  hostClasses = shipComponentClasses('checkbox', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });
}
