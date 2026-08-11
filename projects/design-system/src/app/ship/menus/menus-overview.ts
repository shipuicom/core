import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseMenuExample } from './examples/base-menu-example/base-menu-example';

@Component({
  selector: 'app-menus-overview',
  imports: [Previewer, PropertyViewer, BaseMenuExample],
  templateUrl: './menus-overview.html',
  styleUrl: './menus-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenusOverview {}
