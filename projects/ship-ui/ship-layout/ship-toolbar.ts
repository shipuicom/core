import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutToolbarVariant } from '@ship-ui/core';

/**
 * Gmail-style action bar above a list or table: a single dense line of icon
 * buttons (`button shButton` with an `sh-icon`, `sh-menu`, `sh-button-group`),
 * grouped with `sh-divider`s, an optional `sh-checkbox label="Select all"` at the start, and
 * `[end]` content (count, pagination) pushed to the far end. Buttons inside
 * are flat until hovered — no need to set `variant`/`noBg` on them.
 */
@Component({
  selector: 'sh-lo-toolbar',
  styleUrl: './ship-toolbar.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content />
    <div class="end"><ng-content select="[end], [actions]" /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'toolbar',
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutToolbar {
  /** Visual variant: `type-b` boxed surface, `type-c` divided (bottom border). Project default via `ShipConfig.layoutToolbar.variant`. */
  variant = input<ShipLayoutToolbarVariant | null>(null);

  hostClasses = shipComponentClasses('layoutToolbar', { variant: this.variant });
}
