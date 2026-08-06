import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipVideo, ShipVideoAd } from '@ship-ui/core/ship-video';

@Component({
  selector: 'app-ad-video',
  standalone: true,
  imports: [ShipVideo],
  templateUrl: './ad-video.html',
  styleUrl: './ad-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdVideo {
  ad: ShipVideoAd = {
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    skipAfter: 5,
    clickThroughUrl: 'https://shipui.com',
    label: 'Ad',
  };
}
