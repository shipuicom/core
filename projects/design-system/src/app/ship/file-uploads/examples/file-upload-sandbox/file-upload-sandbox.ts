import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipFileUpload } from '@ship-ui/core/ship-file-upload';

@Component({
  selector: 'app-file-upload-sandbox',
  standalone: true,
  imports: [ShipFileUpload],
  templateUrl: './file-upload-sandbox.html',
  styleUrl: './file-upload-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadSandbox {
  files = signal<File[]>([]);
  multiple = input(true);
  accept = input('.json,.png');
  placeholder = input('Click or drag files here');
  overlayText = input('Drop files here');
}
