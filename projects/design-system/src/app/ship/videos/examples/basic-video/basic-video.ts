import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipVideo } from '@ship-ui/core/ship-video';

@Component({
  selector: 'app-basic-video',
  standalone: true,
  imports: [ShipVideo],
  templateUrl: './basic-video.html',
  styleUrl: './basic-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicVideo {}
