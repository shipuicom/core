import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-file-uploads-parts',
  imports: [ApiReference],
  template: `
    <p>Standalone directive that emits files dropped onto any element.</p>
    <app-api-reference name="ShipFileDragDrop" />
  `,
  styleUrl: './file-uploads-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadsParts {}
