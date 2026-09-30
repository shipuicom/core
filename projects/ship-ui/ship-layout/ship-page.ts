import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';

/**
 * Route-level page layout. Slot the parts in and the page arranges them:
 * `nav` or `sh-breadcrumbs`, `h1`, `p` (description), `[actions]`, `sh-tabs`, the
 * content, and an optional `[aside]` column that drops below the content on
 * narrow screens. Content is centered at a readable max width.
 */
@Component({
  selector: 'sh-lo-page',
  styleUrl: './ship-page.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <div class="nav"><ng-content select="nav, sh-breadcrumbs, [breadcrumbs]" /></div>
      <div class="title">
        <div class="text">
          <ng-content select="h1" />
          <ng-content select="p, [description]" />
        </div>
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
      <ng-content select="sh-tabs" />
    </div>
    <div class="body">
      <div class="main"><ng-content /></div>
      <div class="aside"><ng-content select="[aside]" /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutPage {
  /** Max content width: `small` (forms, settings), default, or `large`. Add class `full` for no limit. */
  size = input<ShipLayoutPageSize | null>(null);
  /** Visual variant: `type-b` divides the header from the content, `type-c` is flush (no page padding). Project default via `ShipConfig.layoutPage.variant`. */
  variant = input<ShipLayoutPageVariant | null>(null);

  hostClasses = shipComponentClasses('layoutPage', { size: this.size, variant: this.variant });
}
