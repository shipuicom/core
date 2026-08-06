import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipVideo } from '@ship-ui/core/ship-video';

@Component({
  selector: 'app-ts-video',
  standalone: true,
  imports: [ShipVideo],
  templateUrl: './ts-video.html',
  styleUrl: './ts-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TsVideo {}
