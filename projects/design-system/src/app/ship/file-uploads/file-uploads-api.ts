import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-file-uploads-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipFileUpload" />`,
  styleUrl: './file-uploads-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadsApi {}
