import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipBreadcrumbsSize, ShipBreadcrumbsVariant } from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { BreadcrumbsSandbox } from './examples/breadcrumbs-sandbox/breadcrumbs-sandbox';
import { ConfigBreadcrumbs } from './examples/config-breadcrumbs/config-breadcrumbs';
import { PageBreadcrumbs } from './examples/page-breadcrumbs/page-breadcrumbs';

@Component({
  selector: 'app-breadcrumbs-examples',
  imports: [Previewer, ShipButtonGroup, BreadcrumbsSandbox, ConfigBreadcrumbs, PageBreadcrumbs],
  templateUrl: './breadcrumbs-examples.html',
  styleUrl: './breadcrumbs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BreadcrumbsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  variant = signal<ShipBreadcrumbsVariant>('');
  size = signal<ShipBreadcrumbsSize>('');
  separator = signal('/');
}
