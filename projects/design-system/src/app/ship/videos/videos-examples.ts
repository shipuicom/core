import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { AdVideo } from './examples/ad-video/ad-video';
import { ComposedVideo } from './examples/composed-video/composed-video';
import { EdgeVideo } from './examples/edge-video/edge-video';
import { HlsVideo } from './examples/hls-video/hls-video';
import { PlaylistVideo } from './examples/playlist-video/playlist-video';
import { TsVideo } from './examples/ts-video/ts-video';

@Component({
  selector: 'app-videos-examples',
  imports: [Previewer, AdVideo, ComposedVideo, EdgeVideo, HlsVideo, TsVideo, PlaylistVideo],
  templateUrl: './videos-examples.html',
  styleUrl: './videos-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VideosExamples {}
