import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-avatars-api',
  imports: [ApiReference],
  template: `
    <app-api-reference name="ShipAvatar" />
    <app-api-reference name="ShipAvatarGroup" />
  `,
  styleUrl: './avatars-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AvatarsApi {}
