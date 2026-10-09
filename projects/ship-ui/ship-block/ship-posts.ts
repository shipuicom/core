import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockPostsVariant } from '@ship-ui/core';

/**
 * Blog or news grid: a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]` such as a "View all" link) and one
 * `sh-bl-post` per article. Set `--posts-cols` for another column count.
 */
@Component({
  selector: 'sh-bl-posts',
  styleUrl: './ship-posts.scss',
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
export class ShipBlockPosts {
  /** Visual variant: default a grid of open cards with the image on top, `type-b` a list (thumbnail beside the text), `type-c` featured (the first post spans two columns and rows). Project default via `ShipConfig.blockPosts.variant`. */
  variant = input<ShipBlockPostsVariant | null>(null);

  hostClasses = shipComponentClasses('blockPosts', { variant: this.variant });
}

/**
 * One article of `sh-bl-posts`: `img`/`picture`/`[media]` (thumbnail), `sh-chip`/`[eyebrow]` (category),
 * `time`/`[meta]` (date, read time), `h3` (put the article's `a` inside it: the whole card becomes its click target),
 * `p` (excerpt, clamped to three lines), anything else, and `footer`/`[author]` (`sh-avatar` and a name).
 */
@Component({
  selector: 'sh-bl-post',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="media"><ng-content select="img, picture, [media]" /></div>
    <div class="body">
      <div class="meta">
        <ng-content select="sh-chip, [eyebrow]" />
        <ng-content select="time, [meta]" />
      </div>
      <ng-content select="h3" />
      <ng-content select="p" />
      <ng-content />
      <ng-content select="footer, [author]" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlockPost {}
