import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockPricingVariant, ShipColor } from '@ship-ui/core';

/**
 * Pricing table: a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]`, where a monthly/yearly `sh-button-group`
 * goes) and one `sh-bl-pricing-tier` per plan. Tiers share a row at equal height; set `--pricing-cols` for another
 * column count.
 */
@Component({
  selector: 'sh-bl-pricing',
  styleUrl: './ship-pricing.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="head">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
      <div class="tiers"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockPricing {
  /** Visual variant: default a row of cards, `type-b` joined columns on one surface (the featured tier lifted), `type-c` compact rows (name, price and call to action side by side, features inline). Project default via `ShipConfig.blockPricing.variant`. */
  variant = input<ShipBlockPricingVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow and every tier's check marks and featured ring; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockPricing', { variant: this.variant, color: this.color });
}

/**
 * One plan of `sh-bl-pricing`: `h3` (plan name), `sh-chip`/`[badge]` (e.g. "Most popular"), `p` (description),
 * `[price]` (a large `b` amount and a muted rest, `<div price><b>$29</b><span>/month</span></div>`), `ul` (features,
 * check-marked), anything else, then `[actions]`/`button`/`a`, a full-width call to action pinned to the bottom.
 */
@Component({
  selector: 'sh-bl-pricing-tier',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="top">
      <ng-content select="h3, [title]" />
      <ng-content select="sh-chip, [badge]" />
    </div>
    <ng-content select="p, [description]" />
    <ng-content select="[price]" />
    <ng-content select="ul" />
    <ng-content />
    <div class="actions"><ng-content select="[actions], button, a" /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'color()',
    '[class.featured]': 'featured()',
  },
})
export class ShipBlockPricingTier {
  /** Highlights the tier: an accent ring, a tinted surface and a raised shadow. */
  featured = input(false, { transform: booleanAttribute });
  /** Accent (`ShipColor`) for this tier only; defaults to the accent of `sh-bl-pricing`. */
  color = input<ShipColor | null>(null);
}
