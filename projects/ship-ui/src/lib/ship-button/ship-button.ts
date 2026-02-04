import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipButtonSize, ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: '[shButton]',
  imports: [],
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet-h',
    '[class]': 'hostClasses()',
  },
})
export class ShipButton {
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  size = input<ShipButtonSize | null>(null);
  readonly = input<boolean>(false);

  hostClasses = shipComponentClasses('button', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    readonly: this.readonly,
  });
}
