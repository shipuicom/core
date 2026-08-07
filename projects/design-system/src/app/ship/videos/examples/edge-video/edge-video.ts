import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipVideo } from '@ship-ui/core/ship-video';

@Component({
  selector: 'app-edge-video',
  standalone: true,
  imports: [ShipVideo],
  templateUrl: './edge-video.html',
  styleUrl: './edge-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeVideo {}
