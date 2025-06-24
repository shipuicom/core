import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleCheckboxComponent,
  SparkleFileUploadComponent,
  SparkleFormFieldComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-file-upload-sandbox',
  standalone: true,
  imports: [FormsModule, SparkleFileUploadComponent, SparkleCheckboxComponent, SparkleFormFieldComponent],
  templateUrl: './file-upload-sandbox.component.html',
  styleUrl: './file-upload-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadSandboxComponent {
  files = signal<File[]>([]);
  multiple = signal<boolean>(true);
  accept = signal<string>('.json,.png');
  placeholder = signal<string>('Click or drag files here');
  overlayText = signal<string>('Drop files here');
}
