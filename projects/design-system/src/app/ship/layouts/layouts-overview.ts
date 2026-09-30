import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { DashboardPageExample } from './examples/dashboard-page/dashboard-page';
import { SettingsPageExample } from './examples/settings-page/settings-page';

@Component({
  selector: 'app-layouts-overview',
  imports: [Previewer, PropertyViewer, DashboardPageExample, SettingsPageExample],
  templateUrl: './layouts-overview.html',
  styleUrl: './layouts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutsOverview {}
