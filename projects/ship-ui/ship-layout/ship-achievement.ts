import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipLayoutAchievementVariant } from '@ship-ui/core';

/**
 * Achievement / badge card. Mix and match the parts: a medallion (`sh-icon`,
 * `img`, `sh-avatar` or anything marked `[media]`), `h3` (title), `p`
 * (description), `sh-chip`/`[tag]` (rarity, level …) and `small`/`[meta]`
 * ("Unlocked Sep 12", "3 of 5"). `color` tints the medallion and glow;
 * for any other color set `dynamic` and the `--achievement-c` CSS variable
 * (like `sh-chip`). `locked` greys it out and shows a lock.
 */
@Component({
  selector: 'sh-lo-achievement',
  styleUrl: './ship-achievement.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="medallion">
      <ng-content select="sh-icon, img, sh-avatar, [media]" />
      @if (locked()) {
        <span class="lock" aria-hidden="true"></span>
      }
    </div>
    <div class="text">
      <div class="title">
        <ng-content select="h2, h3, h4, [title]" />
        <ng-content select="sh-chip, [tag]" />
      </div>
      <ng-content select="p, [description]" />
      <div class="meta"><ng-content select="small, [meta]" /></div>
    </div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[class.locked]': 'locked()',
    '[attr.aria-disabled]': 'locked() || null',
  },
})
export class ShipLayoutAchievement {
  /** Medallion and glow color (`ShipColor`); defaults to primary. */
  color = input<ShipColor | null>(null);
  /** Use an arbitrary color from the `--achievement-c` CSS variable instead of a `ShipColor`. */
  dynamic = input<boolean | undefined, unknown>(undefined, { transform: (v) => (v == null ? undefined : booleanAttribute(v)) });
  /** Not earned yet: greys the medallion out and shows a lock. */
  locked = input(false, { transform: booleanAttribute });
  /** Visual variant: `type-b` horizontal row (medallion beside the text), `type-c` compact pill. Project default via `ShipConfig.layoutAchievement.variant`. */
  variant = input<ShipLayoutAchievementVariant | null>(null);

  hostClasses = shipComponentClasses('layoutAchievement', {
    variant: this.variant,
    color: this.color,
    dynamic: this.dynamic,
  });
}
