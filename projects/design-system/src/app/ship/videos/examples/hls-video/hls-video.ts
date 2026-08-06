import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipVideo } from '@ship-ui/core/ship-video';

@Component({
  selector: 'app-hls-video',
  standalone: true,
  imports: [ShipVideo],
  templateUrl: './hls-video.html',
  styleUrl: './hls-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HlsVideo {}
