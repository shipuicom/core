import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicBreadcrumbs } from './examples/basic-breadcrumbs/basic-breadcrumbs';

@Component({
  selector: 'app-breadcrumbs-overview',
  imports: [Previewer, BasicBreadcrumbs],
  templateUrl: './breadcrumbs-overview.html',
  styleUrl: './breadcrumbs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BreadcrumbsOverview {}
