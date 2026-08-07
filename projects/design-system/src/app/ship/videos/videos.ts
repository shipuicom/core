import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { AdVideo } from './examples/ad-video/ad-video';
import { BasicVideo } from './examples/basic-video/basic-video';
import { ComposedVideo } from './examples/composed-video/composed-video';
import { EdgeVideo } from './examples/edge-video/edge-video';
import { HlsVideo } from './examples/hls-video/hls-video';
import { PlaylistVideo } from './examples/playlist-video/playlist-video';
import { TsVideo } from './examples/ts-video/ts-video';

@Component({
  selector: 'app-videos',
  imports: [
    ShipTabs,
    ApiReference,
    PropertyViewer,
    Previewer,
    BasicVideo,
    AdVideo,
    ComposedVideo,
    EdgeVideo,
    HlsVideo,
    TsVideo,
    PlaylistVideo,
  ],
  templateUrl: './videos.html',
  styleUrl: './videos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Videos {
  activeTab = signal('overview');
}
