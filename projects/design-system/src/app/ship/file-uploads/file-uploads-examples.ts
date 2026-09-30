import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { Previewer } from '../../previewer/previewer';
import { BaseFileUpload } from './examples/base-file-upload/base-file-upload';
import { FileUploadSandbox } from './examples/file-upload-sandbox/file-upload-sandbox';

@Component({
  selector: 'app-file-uploads-examples',
  imports: [FormsModule, Previewer, ShipCheckbox, ShipFormField, FileUploadSandbox, BaseFileUpload],
  templateUrl: './file-uploads-examples.html',
  styleUrl: './file-uploads-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  multiple = signal(true);
  accept = signal('.json,.png');
  placeholder = signal('Click or drag files here');
  overlayText = signal('Drop files here');
}
