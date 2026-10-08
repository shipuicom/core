import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockFooterVariant } from '@ship-ui/core';

/**
 * Site footer: a brand column with `[logo]`, a `p`/`[tagline]` and any other content (a newsletter form), then one
 * link column per `nav` (an `h3`/`h4`/`b` heading followed by `a` links, directly or in a `ul`). The bottom bar holds
 * `small`/`[legal]` (copyright, legal links) and `[social]` (a row of icon links, each with an `aria-label`). Wrap it
 * in a `<footer>` (or give it `role="contentinfo"`) for the landmark, and give each `nav` an `aria-label`.
 */
@Component({
  selector: 'sh-bl-footer',
  styleUrl: './ship-footer.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="top">
        <div class="brand">
          <ng-content select="[logo]" />
          <ng-content select="p, [tagline]" />
          <ng-content />
        </div>
        <div class="links"><ng-content select="nav" /></div>
      </div>
      <div class="bottom">
        <div class="legal"><ng-content select="small, [legal]" /></div>
        <div class="social"><ng-content select="[social]" /></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockFooter {
  /** Visual variant: default brand column beside the link columns over a legal/social bar, `type-b` centred and simple (one row of links, nav headings kept for screen readers only), `type-c` compact single row (logo, links, legal and social; the tagline is hidden). Project default via `ShipConfig.blockFooter.variant`. */
  variant = input<ShipBlockFooterVariant | null>(null);

  hostClasses = shipComponentClasses('blockFooter', { variant: this.variant });
}
