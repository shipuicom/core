import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-radio',
  imports: [],
  template: `
    <div class="radio sh-sheet" [class]="currentClassList()"></div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipRadio {
  currentClassList = classMutationSignal();
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  readonly = input<boolean>(false);

  hostClasses = shipComponentClasses('radio', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });
}
