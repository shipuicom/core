import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from 'ship-ui';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BasicDynamicDialogComponent } from './examples/basic-dynamic-dialog/basic-dynamic-dialog.component';
import { DataPassingDialogComponent } from './examples/data-passing-dialog/data-passing-dialog.component';
import { DialogAsComponentComponent } from './examples/dialog-as-component/dialog-as-component.component';
import { HeaderFooterDialogComponent } from './examples/header-footer-dialog/header-footer-dialog.component';

@Component({
  selector: 'app-dialogs',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    BasicDynamicDialogComponent,
    HeaderFooterDialogComponent,
    DataPassingDialogComponent,
    DialogAsComponentComponent,

    ShipButtonGroup,
  ],
  templateUrl: './dialogs.component.html',
  styleUrl: './dialogs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsComponent {
  type = signal('');
}
