import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBreadcrumbsSize, ShipBreadcrumbsVariant } from '@ship-ui/core';
import { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-breadcrumbs-sandbox',
  imports: [ShipBreadcrumbs, ShipIcon],
  templateUrl: './breadcrumbs-sandbox.html',
  styleUrl: './breadcrumbs-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsSandbox {
  variant = input<ShipBreadcrumbsVariant>('');
  size = input<ShipBreadcrumbsSize>('');
  separator = input('/');
}
