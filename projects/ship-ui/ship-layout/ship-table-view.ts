import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutTableViewVariant } from '@ship-ui/core';

/**
 * Full-page data view: header, filters, a bulk-action toolbar, the table and a
 * footer. Slots: `h1`/`h2` (title), `p` (description), `[actions]` (primary
 * buttons), `[filters]` (search field, filter chips, `sh-table-filter-bar`),
 * `sh-lo-toolbar` (bulk actions), `sh-table` (fills the remaining height and
 * scrolls; mark its header row `class="sticky"` to pin it) and `[footer]`
 * (count, pagination). Give it a height (it fills its parent) for the table to
 * scroll on its own.
 */
@Component({
  selector: 'sh-lo-table-view',
  styleUrl: './ship-table-view.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <div class="text">
        <ng-content select="h1, h2, [title]" />
        <ng-content select="p, [description]" />
      </div>
      <div class="actions"><ng-content select="[actions]" /></div>
    </div>
    <div class="filters"><ng-content select="[filters]" /></div>
    <div class="surface">
      <ng-content select="sh-lo-toolbar, [toolbar]" />
      <div class="table"><ng-content select="sh-table, table, [table]" /></div>
      <div class="footer"><ng-content select="[footer]" /></div>
    </div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutTableView {
  /** Visual variant: `type-b` toolbar, table and footer inside one card, `type-c` flush (no page padding, for a table inside a sidenav's main). Project default via `ShipConfig.layoutTableView.variant`. */
  variant = input<ShipLayoutTableViewVariant | null>(null);

  hostClasses = shipComponentClasses('layoutTableView', { variant: this.variant });
}
