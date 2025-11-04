import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipCheckbox, ShipFileUpload, ShipFormField } from 'ship-ui';

@Component({
  selector: 'app-file-upload-sandbox',
  standalone: true,
  imports: [FormsModule, ShipFileUpload, ShipCheckbox, ShipFormField],
  templateUrl: './file-upload-sandbox.html',
  styleUrl: './file-upload-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadSandbox {
  files = signal<File[]>([]);
  multiple = signal<boolean>(true);
  accept = signal<string>('.json,.png');
  placeholder = signal<string>('Click or drag files here');
  overlayText = signal<string>('Drop files here');
}
