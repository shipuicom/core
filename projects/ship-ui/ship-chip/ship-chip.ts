import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant, ShipSize } from '@ship-ui/core';

@Component({
  selector: 'sh-chip',
  styleUrl: './ship-chip.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  standalone: true,
  template: '<div><ng-content /></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
    '[class]': 'hostClasses()',
    '[class.no-bg]': 'noBg()',
  },
})
export class ShipChip {
  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`). */
  color = input<ShipColor | null>(null);
  /** Visual variant of the chip sheet. */
  variant = input<ShipSheetVariant | null>(null);
  /** Size preset. */
  size = input<ShipSize | null>(null);

  /** Use sharp (non-rounded) corners. */
  sharp = input<boolean | undefined>(undefined);
  /** Enable the dynamic styling variant. */
  dynamic = input<boolean | undefined>(undefined);
  /** Render in a non-interactive read-only state. */
  readonly = input<boolean>(false);
  /** Render without a background fill. */
  noBg = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  hostClasses = shipComponentClasses('chip', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    sharp: this.sharp,
    dynamic: this.dynamic,
    readonly: this.readonly,
  });
}
