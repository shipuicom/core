import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockContactVariant, ShipColor } from '@ship-ui/core';

/**
 * Contact section: `[eyebrow]`/`sh-chip`, `h2`, `p`, the contact methods as `ul`/`dl`/`address`/`[details]` (each
 * `li` an `sh-icon` followed by text or a link, optionally a `b` label above it), a `form`/`[form]` (wrap two fields
 * in a `[row]` element to put them side by side), and anything else (a map image) below the details.
 */
@Component({
  selector: 'sh-bl-contact',
  styleUrl: './ship-contact.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="head">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
      </div>
      <div class="details"><ng-content select="ul, dl, address, [details]" /></div>
      <div class="form"><ng-content select="form, [form]" /></div>
      <div class="extra"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockContact {
  /** Visual variant: default split (details left, form on a bordered surface right), `type-b` centered (a row of methods above the form), `type-c` a form card on a tinted band. Project default via `ShipConfig.blockContact.variant`. */
  variant = input<ShipBlockContactVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow, the icon tiles and the `type-c` band; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockContact', { variant: this.variant, color: this.color });
}
