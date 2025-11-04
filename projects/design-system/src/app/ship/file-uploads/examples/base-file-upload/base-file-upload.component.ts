import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipFileUpload } from 'ship-ui';

@Component({
  selector: 'app-base-file-upload',
  imports: [ShipFileUpload],
  templateUrl: './base-file-upload.component.html',
  styleUrl: './base-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseFileUploadComponent {
  files = signal<File[]>([]);
}
