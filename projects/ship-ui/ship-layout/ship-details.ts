import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutDetailsVariant } from '@ship-ui/core';

/**
 * Key/value list ("Details" panel). Slot an `h3` and `[actions]` for the
 * header, then one `sh-lo-detail` per row.
 */
@Component({
  selector: 'sh-lo-details',
  styleUrl: './ship-details.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <ng-content select="h2, h3, [title]" />
      <div class="actions"><ng-content select="[actions]" /></div>
    </div>
    <div class="body"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutDetails {
  /** Visual variant: `type-b` stacked pairs in a grid, `type-c` compact inline pairs. Project default via `ShipConfig.layoutDetails.variant`. */
  variant = input<ShipLayoutDetailsVariant | null>(null);

  hostClasses = shipComponentClasses('layoutDetails', { variant: this.variant });
}

/** One row of `sh-lo-details`: `dt`/`[term]` then the value (anything else). */
@Component({
  selector: 'sh-lo-detail',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="term"><ng-content select="dt, [term]" /></div>
    <div class="value"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipLayoutDetail {}
