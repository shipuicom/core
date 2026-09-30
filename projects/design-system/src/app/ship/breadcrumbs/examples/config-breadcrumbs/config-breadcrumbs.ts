import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';
import { ShipIcon } from '@ship-ui/core/ship-icon';

interface Crumb {
  label: string;
  href: string;
  icon?: string;
}

@Component({
  selector: 'app-config-breadcrumbs-example',
  imports: [ShipBreadcrumbs, ShipIcon],
  templateUrl: './config-breadcrumbs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigBreadcrumbs {
  // Build the trail from data instead of hand-written children. In an app this
  // usually comes from the router (route `data`) or a breadcrumbs service, and
  // each link is an `a[routerLink]` rather than `a[href]`.
  crumbs: Crumb[] = [
    { label: 'Home', href: '#', icon: 'house' },
    { label: 'Workspace', href: '#' },
    { label: 'Projects', href: '#' },
    { label: 'Ship UI', href: '#' },
  ];
}
