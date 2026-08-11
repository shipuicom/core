import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-videos-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipVideo" />
    <app-api-reference name="ShipVideoPlaylist" />
  `,
  styleUrl: './videos-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VideosApi {}
