import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-videos-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './videos-service.html',
  styleUrl: './videos-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VideosService {
  codeShare = `import { Component, inject } from '@angular/core';
import { ShipVideoState } from '@ship-ui/core/ship-video';

// Provide the state on a wrapper to share one store between the projected
// player, your own controls and any editor chrome around it.
@Component({
  selector: 'app-video-editor',
  providers: [ShipVideoState],
  template: \`
    <sh-video [src]="src()" />
    <app-timeline />
  \`,
})
export class VideoEditor {
  state = inject(ShipVideoState);
}`;

  codeSignals = `// Writable signals ARE the API — setting them commands the player
state.playing.set(true);        // play
state.currentTime.set(12.5);    // seek (seconds)
state.volume.set(0.5);
state.muted.set(true);
state.playbackRate.set(1.5);
state.quality.set(2);           // level id from state.levels(), or 'auto'
state.textTrack.set(0);         // subtitle track id, null = off

// Observed state written by the player/engine
state.duration();               // seconds
state.bufferedRanges();         // ShipVideoTimeRange[]
state.isLive();                 // live stream?
state.levels();                 // available quality levels`;

  codeCommands = `// Commands delegate to the bound player
state.start();                  // first play (runs pre-roll ad when configured)
state.togglePlay();
state.toggleMute();
state.seekTo(30, { precise: true });
state.step(1);                  // frame stepping (pauses playback)
state.goToLive();
state.toggleFullscreen();
state.togglePip();
state.requestCast();            // Chromecast / Remote Playback picker
state.requestAirplay();         // Safari AirPlay picker`;

  codeFrames = `// requestVideoFrameCallback passthrough — e.g. drawing filmstrips
const stop = state.onVideoFrame((time) => this.drawOverlay(time));

// The raw <video> element (canvas capture etc.); null during SSR
const video = state.mediaElement();

stop(); // unsubscribe`;
}
