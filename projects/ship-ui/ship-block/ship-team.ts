import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockTeamVariant } from '@ship-ui/core';

/**
 * Team grid: a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]`) and one `sh-bl-member` per person. Set
 * `--team-cols` for another column count.
 */
@Component({
  selector: 'sh-bl-team',
  styleUrl: './ship-team.scss',
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
export class ShipBlockTeam {
  /** Visual variant: default centered people with round photos, `type-b` cards with a square photo on top, `type-c` a compact two-column list. Project default via `ShipConfig.blockTeam.variant`. */
  variant = input<ShipBlockTeamVariant | null>(null);

  hostClasses = shipComponentClasses('blockTeam', { variant: this.variant });
}

/**
 * One person of `sh-bl-team`: `img`/`sh-avatar`/`[photo]`, `b`/`h3`/`[name]`, `span`/`[job]` (the role), then a bio
 * (`p` or anything else), and `[social]` (a row of icon links, each with an `aria-label`).
 */
@Component({
  selector: 'sh-bl-member',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content select="img, sh-avatar, [photo]" />
    <div class="text">
      <ng-content select="b, h3, [name]" />
      <ng-content select="span, [job]" />
      <ng-content />
    </div>
    <ng-content select="[social]" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlockMember {}
