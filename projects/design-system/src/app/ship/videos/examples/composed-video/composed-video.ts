import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ShipVideo,
  ShipVideoAirplayButton,
  ShipVideoCaptionsButton,
  ShipVideoCastButton,
  ShipVideoControls,
  ShipVideoFullscreenButton,
  ShipVideoPipButton,
  ShipVideoPlayButton,
  ShipVideoPlaytimeLeft,
  ShipVideoScrubber,
  ShipVideoSettings,
  ShipVideoSource,
  ShipVideoTime,
  ShipVideoTrack,
  ShipVideoVolume,
} from '@ship-ui/core/ship-video';

const SINTEL = 'https://download.blender.org/durian/trailer';

function vtt(lines: string[]): string {
  return 'data:text/vtt,' + encodeURIComponent(['WEBVTT', '', ...lines].join('\n'));
}

@Component({
  selector: 'app-composed-video',
  standalone: true,
  imports: [
    ShipVideo,
    ShipVideoControls,
    ShipVideoScrubber,
    ShipVideoPlayButton,
    ShipVideoVolume,
    ShipVideoTime,
    ShipVideoPlaytimeLeft,
    ShipVideoCaptionsButton,
    ShipVideoSettings,
    ShipVideoCastButton,
    ShipVideoAirplayButton,
    ShipVideoPipButton,
    ShipVideoFullscreenButton,
  ],
  templateUrl: './composed-video.html',
  styleUrl: './composed-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComposedVideo {
  /** height-tagged variants feed the quality section of the settings menu */
  sources: ShipVideoSource[] = [
    { src: `${SINTEL}/sintel_trailer-1080p.mp4`, height: 1080 },
    { src: `${SINTEL}/sintel_trailer-720p.mp4`, height: 720 },
    { src: `${SINTEL}/sintel_trailer-480p.mp4`, height: 480 },
  ];

  tracks: ShipVideoTrack[] = [
    {
      src: vtt(['00:00.000 --> 00:05.000', 'A fully composed ship-ui player', '', '00:05.000 --> 00:10.000', 'Every control is its own component']),
      srclang: 'en',
      label: 'English',
      default: true,
    },
    {
      src: vtt(['00:00.000 --> 00:05.000', 'En fuldt komponeret ship-ui afspiller', '', '00:05.000 --> 00:10.000', 'Hver kontrol er sin egen komponent']),
      srclang: 'da',
      label: 'Dansk',
    },
  ];
}
