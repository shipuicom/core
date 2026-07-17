import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseFileUpload } from './examples/base-file-upload/base-file-upload';
import { FileUploadSandbox } from './examples/file-upload-sandbox/file-upload-sandbox';

@Component({
  selector: 'app-file-uploads',
  imports: [ShipTabs, ApiReference, FormsModule, PropertyViewer, Previewer, FileUploadSandbox, BaseFileUpload],
  templateUrl: './file-uploads.html',
  styleUrl: './file-uploads.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploads {
  activeTab = signal('overview');
}
