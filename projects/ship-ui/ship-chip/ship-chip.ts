import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
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
  },
})
export class ShipChip {
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  size = input<ShipSize | null>(null);

  sharp = input<boolean | undefined>(undefined);
  dynamic = input<boolean | undefined>(undefined);
  readonly = input<boolean>(false);

  hostClasses = shipComponentClasses('chip', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    sharp: this.sharp,
    dynamic: this.dynamic,
    readonly: this.readonly,
  });
}
