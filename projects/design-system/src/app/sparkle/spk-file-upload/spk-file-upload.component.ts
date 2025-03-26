import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormBuilder, FormsModule } from '@angular/forms';
import { SparkleFileUploadComponent, SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

const fb = new FormBuilder();

@Component({
  selector: 'app-spk-file-upload',
  imports: [FormsModule, SparkleFileUploadComponent, SparkleIconComponent, JsonPipe],
  templateUrl: './spk-file-upload.component.html',
  styleUrl: './spk-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkFileUploadComponent {
  files = signal<File[]>([]);

  fileEffect = effect(() => {
    console.log('files: ', this.files());
  });
}
