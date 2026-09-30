import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-breadcrumbs-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipBreadcrumbs" />`,
  styleUrl: './breadcrumbs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BreadcrumbsApi {}
