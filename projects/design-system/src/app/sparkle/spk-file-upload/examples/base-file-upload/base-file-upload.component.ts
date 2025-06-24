import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleFileUploadComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-file-upload',
  imports: [SparkleFileUploadComponent],
  templateUrl: './base-file-upload.component.html',
  styleUrl: './base-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseFileUploadComponent {
  files = signal<File[]>([]);
}
