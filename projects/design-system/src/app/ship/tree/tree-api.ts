import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-tree-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipTree" />`,
  styleUrl: './tree-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TreeApi {}
