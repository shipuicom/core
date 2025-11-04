import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipFileUpload } from 'ship-ui';

@Component({
  selector: 'app-base-file-upload',
  imports: [ShipFileUpload],
  templateUrl: './base-file-upload.html',
  styleUrl: './base-file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseFileUpload {
  files = signal<File[]>([]);
}
