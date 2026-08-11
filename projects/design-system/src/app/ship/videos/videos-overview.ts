import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicVideo } from './examples/basic-video/basic-video';

@Component({
  selector: 'app-videos-overview',
  imports: [Previewer, PropertyViewer, BasicVideo],
  templateUrl: './videos-overview.html',
  styleUrl: './videos-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VideosOverview {}
