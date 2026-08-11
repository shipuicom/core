import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicDynamicDialog } from './examples/basic-dynamic-dialog/basic-dynamic-dialog';

@Component({
  selector: 'app-dialogs-overview',
  imports: [Previewer, PropertyViewer, BasicDynamicDialog],
  templateUrl: './dialogs-overview.html',
  styleUrl: './dialogs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsOverview {}
