import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipFileUploadComponent } from 'ship-ui';

@Component({
  selector: 'app-base-file-upload',
  imports: [ShipFileUploadComponent],
  templateUrl: './base-file-upload.component.html',
  styleUrl: './base-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseFileUploadComponent {
  files = signal<File[]>([]);
}
