import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockNewsletterVariant, ShipColor } from '@ship-ui/core';

/**
 * Newsletter sign-up: `sh-icon`/`[icon]`, `[eyebrow]`, `h2`/`h3`, `p`, a `form`/`[form]` (an `sh-form-field` and a
 * submit button, laid out as one row that stacks when narrow), a `small` privacy note, then anything else.
 */
@Component({
  selector: 'sh-bl-newsletter',
  styleUrl: './ship-newsletter.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="box">
        <div class="text">
          <ng-content select="sh-icon, [icon]" />
          <ng-content select="[eyebrow]" />
          <ng-content select="h2, h3" />
          <ng-content select="p, [description]" />
        </div>
        <div class="form">
          <ng-content select="form, [form]" />
          <ng-content select="small" />
          <ng-content />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockNewsletter {
  /** Visual variant: default a centered stack, `type-b` inline (the text beside the form), `type-c` a boxed sign-up card on a tinted panel. Project default via `ShipConfig.blockNewsletter.variant`. */
  variant = input<ShipBlockNewsletterVariant | null>(null);
  /** Accent (`ShipColor`) for the icon tile, the eyebrow and the `type-c` panel; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockNewsletter', { variant: this.variant, color: this.color });
}
