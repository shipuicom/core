import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleFileUploadComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-file-upload',
  standalone: true,
  imports: [SparkleFileUploadComponent],
  templateUrl: './spk-file-upload.component.html',
  styleUrl: './spk-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkFileUploadComponent {}
