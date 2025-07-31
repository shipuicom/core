import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BasicDynamicDialogComponent } from './examples/basic-dynamic-dialog/basic-dynamic-dialog.component';
import { DataPassingDialogComponent } from './examples/data-passing-dialog/data-passing-dialog.component';
import { HeaderFooterDialogComponent } from './examples/header-footer-dialog/header-footer-dialog.component';

@Component({
  selector: 'app-dialogs',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    BasicDynamicDialogComponent,
    HeaderFooterDialogComponent,
    DataPassingDialogComponent,
  ],
  templateUrl: './dialogs.component.html',
  styleUrl: './dialogs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsComponent {}
