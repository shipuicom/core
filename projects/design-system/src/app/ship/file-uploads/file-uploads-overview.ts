import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseFileUpload } from './examples/base-file-upload/base-file-upload';

@Component({
  selector: 'app-file-uploads-overview',
  imports: [Previewer, PropertyViewer, BaseFileUpload],
  templateUrl: './file-uploads-overview.html',
  styleUrl: './file-uploads-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadsOverview {}
