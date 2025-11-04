import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicDynamicDialog } from './examples/basic-dynamic-dialog/basic-dynamic-dialog';
import { DataPassingDialog } from './examples/data-passing-dialog/data-passing-dialog';
import { DialogAsComponent } from './examples/dialog-as-component/dialog-as-component';
import { HeaderFooterDialog } from './examples/header-footer-dialog/header-footer-dialog';

@Component({
  selector: 'app-dialogs',
  imports: [
    Previewer,
    PropertyViewer,
    BasicDynamicDialog,
    HeaderFooterDialog,
    DataPassingDialog,
    DialogAsComponent,

    ShipButtonGroup,
  ],
  templateUrl: './dialogs.html',
  styleUrl: './dialogs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dialogs {
  type = signal('');
}
