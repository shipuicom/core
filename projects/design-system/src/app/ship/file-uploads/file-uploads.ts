import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseFileUpload } from './examples/base-file-upload/base-file-upload';
import { FileUploadSandbox } from './examples/file-upload-sandbox/file-upload-sandbox';

@Component({
  selector: 'app-file-uploads',
  imports: [FormsModule, PropertyViewer, Previewer, FileUploadSandbox, BaseFileUpload],
  templateUrl: './file-uploads.html',
  styleUrl: './file-uploads.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploads {}
