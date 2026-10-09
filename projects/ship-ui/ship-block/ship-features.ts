import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockFeaturesVariant, ShipColor } from '@ship-ui/core';

/**
 * Feature grid: a header (`[eyebrow]`, `h2`, `p`, `[actions]`) and one `sh-bl-feature` per feature. Set
 * `--features-cols` for another column count.
 */
@Component({
  selector: 'sh-bl-features',
  styleUrl: './ship-features.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="head">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
      <div class="items"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockFeatures {
  /** Visual variant: default open grid, `type-b` every feature on a card, `type-c` the header beside a two-column list. Project default via `ShipConfig.blockFeatures.variant`. */
  variant = input<ShipBlockFeaturesVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow and the icon tiles; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockFeatures', { variant: this.variant, color: this.color });
}

/** One feature of `sh-bl-features`: `sh-icon`/`img`/`[icon]`, `h3`, `p`, then anything else (a link). */
@Component({
  selector: 'sh-bl-feature',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="icon"><ng-content select="sh-icon, img, [icon]" /></div>
    <div class="text">
      <ng-content select="h3, [title]" />
      <ng-content select="p, [description]" />
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlockFeature {}
