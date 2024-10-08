import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SparkleFileUploadComponent, SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

const fb = new FormBuilder();

@Component({
  selector: 'app-spk-file-upload',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleFileUploadComponent, SparkleIconComponent],
  templateUrl: './spk-file-upload.component.html',
  styleUrl: './spk-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkFileUploadComponent {
  form = fb.group({
    file: null,
  });
}
