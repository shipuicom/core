import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockSplitVariant, ShipColor } from '@ship-ui/core';

/**
 * Media beside text, the classic alternating feature section: `[eyebrow]`/`sh-chip`, `h2`, `p`, a `ul` of benefits
 * (each `li` gets a check marker), `[actions]`/`button`/`a`, anything else, and an `img`/`video`/`picture`/`[media]`.
 * Add the class `reverse` to put the media first.
 */
@Component({
  selector: 'sh-bl-split',
  styleUrl: './ship-split.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="text">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
        <ng-content select="ul" />
        <div class="actions"><ng-content select="[actions], button, a" /></div>
        <ng-content />
      </div>
      <div class="media"><ng-content select="img, video, picture, [media]" /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockSplit {
  /** Visual variant: default 50/50 with a framed media, `type-b` the media on a tinted panel, `type-c` the media bleeding to the block's edge. Project default via `ShipConfig.blockSplit.variant`. */
  variant = input<ShipBlockSplitVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow, the list check markers and the `type-b` panel; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockSplit', { variant: this.variant, color: this.color });
}
