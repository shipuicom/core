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
  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`). */
  color = input<ShipColor | null>(null);
  /** Visual variant (`simple`, `outlined`, `flat`, `raised`). */
  variant = input<ShipSheetVariant | null>(null);
  /** Size preset (`small`, `xsmall`, or default). */
  size = input<ShipButtonSize | null>(null);
  /** Render in a non-interactive read-only state. */
  readonly = input<boolean>(false);
  /** Remove the background (adds the `no-bg` class). */
  noBg = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  hostClasses = shipComponentClasses('button', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    readonly: this.readonly,
  });
}
