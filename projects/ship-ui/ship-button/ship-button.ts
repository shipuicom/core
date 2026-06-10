import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipButtonSize, ShipColor, ShipSheetVariant } from '@ship-ui/core';

@Component({
  selector: '[shButton]',
  styleUrl: './ship-button.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet-h',
    '[class]': 'hostClasses()',
    '[class.no-bg]': 'noBg()',
  },
})
export class ShipButton {
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  size = input<ShipButtonSize | null>(null);
  readonly = input<boolean>(false);
  noBg = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  hostClasses = shipComponentClasses('button', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    readonly: this.readonly,
  });
}
