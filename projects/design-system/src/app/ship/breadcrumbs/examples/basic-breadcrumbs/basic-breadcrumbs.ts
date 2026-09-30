import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';

@Component({
  selector: 'app-basic-breadcrumbs-example',
  imports: [ShipBreadcrumbs],
  templateUrl: './basic-breadcrumbs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicBreadcrumbs {}
