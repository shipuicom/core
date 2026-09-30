import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutSectionVariant } from '@ship-ui/core';

/**
 * A titled block of a page: `h2`/`h3`, `p` (description) and `[actions]` in
 * a header row, then whatever content follows, stacked.
 */
@Component({
  selector: 'sh-lo-section',
  styleUrl: './ship-section.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <div class="text">
        <ng-content select="h2, h3" />
        <ng-content select="p, [description]" />
      </div>
      <div class="actions"><ng-content select="[actions]" /></div>
    </div>
    <div class="body"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutSection {
  /** Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutSection.variant`. */
  variant = input<ShipLayoutSectionVariant | null>(null);

  hostClasses = shipComponentClasses('layoutSection', { variant: this.variant });
}
