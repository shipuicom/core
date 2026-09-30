import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBreadcrumbsSize, ShipBreadcrumbsVariant } from '@ship-ui/core';

/**
 * Breadcrumb trail. Put the crumbs in as direct children (`a[routerLink]`,
 * `a[href]`, `button` or a plain `span`), optionally with an `sh-icon` inside;
 * separators are drawn between them. The last crumb is styled as the current
 * page — mark it `aria-current="page"`. Slots into `sh-lo-page`'s nav area.
 */
@Component({
  selector: 'sh-breadcrumbs',
  styleUrl: './ship-breadcrumbs.scss',
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'label()',
    '[class]': 'hostClasses()',
    '[style.--breadcrumbs-sep]': 'separatorContent()',
  },
})
export class ShipBreadcrumbs {
  /** Accessible name of the navigation landmark. */
  label = input<string>('Breadcrumb');
  /** Character(s) drawn between crumbs. Hidden from assistive tech. */
  separator = input<string>('/');
  /** Visual variant: `type-b` boxed surface, `type-c` pill crumbs. Project default via `ShipConfig.breadcrumbs.variant`. */
  variant = input<ShipBreadcrumbsVariant | null>(null);
  /** `small` for dense headers. Project default via `ShipConfig.breadcrumbs.size`. */
  size = input<ShipBreadcrumbsSize | null>(null);

  separatorContent = computed(() => JSON.stringify(this.separator()));
  hostClasses = shipComponentClasses('breadcrumbs', { variant: this.variant, size: this.size });
}
