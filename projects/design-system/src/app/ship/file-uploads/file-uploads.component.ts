import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseFileUploadComponent } from './examples/base-file-upload/base-file-upload.component';
import { FileUploadSandboxComponent } from './examples/file-upload-sandbox/file-upload-sandbox.component';

@Component({
  selector: 'app-file-uploads',
  imports: [
    FormsModule,
    PropertyViewerComponent,
    PreviewerComponent,
    FileUploadSandboxComponent,
    BaseFileUploadComponent,
  ],
  templateUrl: './file-uploads.component.html',
  styleUrl: './file-uploads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadsComponent {}
