import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockTestimonialsVariant, ShipColor } from '@ship-ui/core';

/**
 * Customer quotes: a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]`) and one `sh-bl-testimonial` per quote.
 * Set `--testimonials-cols` for another column count.
 */
@Component({
  selector: 'sh-bl-testimonials',
  styleUrl: './ship-testimonials.scss',
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
export class ShipBlockTestimonials {
  /** Visual variant: default a grid of cards, `type-b` one large centered quote (several stack between rules), `type-c` a masonry of cards. Project default via `ShipConfig.blockTestimonials.variant`. */
  variant = input<ShipBlockTestimonialsVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow, the `[rating]` stars and the quote mark; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockTestimonials', { variant: this.variant, color: this.color });
}

/**
 * One quote of `sh-bl-testimonials`, rendered as a `figure`: `[rating]` (a row of stars), `blockquote`/`p` (the
 * quote), anything else, then a caption with `sh-avatar`/`img`/`[avatar]`, `b`/`cite`/`[name]` and
 * `span`/`small`/`[role]` (title, company).
 */
@Component({
  selector: 'sh-bl-testimonial',
  encapsulation: ViewEncapsulation.None,
  template: `
    <figure>
      <ng-content select="[rating]" />
      <ng-content select="blockquote, p, [quote]" />
      <ng-content />
      <figcaption>
        <ng-content select="sh-avatar, img, [avatar]" />
        <span class="who">
          <ng-content select="b, cite, [name]" />
          <ng-content select="span, small, [role]" />
        </span>
      </figcaption>
    </figure>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlockTestimonial {}
