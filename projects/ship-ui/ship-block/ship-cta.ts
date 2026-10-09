import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockCtaVariant, ShipColor } from '@ship-ui/core';

/**
 * Call to action on a panel: `[eyebrow]`/`sh-chip`, `h2`, `p`, anything else, `[actions]`/`button`/`a`, `small` fine
 * print, and an optional `img`/`video`/`picture`/`[media]` shown beside the text.
 */
@Component({
  selector: 'sh-bl-cta',
  styleUrl: './ship-cta.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="panel">
        <div class="body">
          <div class="text">
            <ng-content select="[eyebrow], sh-chip" />
            <ng-content select="h2" />
            <ng-content select="p, [description]" />
            <ng-content />
          </div>
          <div class="side">
            <div class="actions"><ng-content select="[actions], button, a" /></div>
            <ng-content select="small" />
          </div>
        </div>
        <div class="media"><ng-content select="img, video, picture, [media]" /></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockCta {
  /** Visual variant: default centered on a tinted panel, `type-b` a bold solid panel with a soft glow, `type-c` text and actions in one row on a bordered panel. Project default via `ShipConfig.blockCta.variant`. */
  variant = input<ShipBlockCtaVariant | null>(null);
  /** Accent (`ShipColor`) for the panel and the eyebrow; defaults to grey for the panel and primary for the eyebrow. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockCta', { variant: this.variant, color: this.color });
}
