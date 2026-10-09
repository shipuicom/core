import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockLogosVariant } from '@ship-ui/core';

/**
 * Logo cloud ("Trusted by …"): a small caption (`p`, `h2` or `[caption]`), then the brand marks as `img`, `svg`, `a`,
 * `span` or `[logo]` (e.g. `<span logo><sh-icon>hexagon</sh-icon>Hexacorp</span>`). Logos render muted and take
 * their full colour on hover. Set `--logos-cols` for another cell count in `type-b`.
 */
@Component({
  selector: 'sh-bl-logos',
  styleUrl: './ship-logos.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="caption"><ng-content select="p, h2, [caption]" /></div>
      <div class="items"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockLogos {
  /** Visual variant: default caption above a centered row of logos, `type-b` a grid of bordered cells, `type-c` the caption beside the logos behind a divider. Project default via `ShipConfig.blockLogos.variant`. */
  variant = input<ShipBlockLogosVariant | null>(null);

  hostClasses = shipComponentClasses('blockLogos', { variant: this.variant });
}
