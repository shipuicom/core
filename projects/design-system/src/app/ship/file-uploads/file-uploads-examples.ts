import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseFileUpload } from './examples/base-file-upload/base-file-upload';
import { FileUploadSandbox } from './examples/file-upload-sandbox/file-upload-sandbox';

@Component({
  selector: 'app-file-uploads-examples',
  imports: [Previewer, FileUploadSandbox, BaseFileUpload],
  templateUrl: './file-uploads-examples.html',
  styleUrl: './file-uploads-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadsExamples {}
