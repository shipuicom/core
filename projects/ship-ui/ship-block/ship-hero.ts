import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockHeroVariant, ShipColor } from '@ship-ui/core';

/**
 * The opening block of a page: `[eyebrow]`/`sh-chip`, `h1`, `p`, `[actions]`/`button`/`a`, any fine print, and an
 * `img`/`video`/`picture`/`[media]`. Wrap words of the `h1` in `em` to accent them in `color`.
 */
@Component({
  selector: 'sh-bl-hero',
  styleUrl: './ship-hero.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="text">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h1, h2" />
        <ng-content select="p, [description]" />
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
export class ShipBlockHero {
  /** Visual variant: default centered with the media below, `type-b` split (text beside the media), `type-c` cover (the media fills the block behind the text). Project default via `ShipConfig.blockHero.variant`. */
  variant = input<ShipBlockHeroVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow and `h1 em`; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockHero', { variant: this.variant, color: this.color });
}
