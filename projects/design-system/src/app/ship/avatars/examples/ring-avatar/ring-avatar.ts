import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAvatar, ShipAvatarGroup } from '@ship-ui/core/ship-avatar';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

@Component({
  selector: 'app-ring-avatar',
  imports: [ShipAvatar, ShipAvatarGroup, ShipTooltip],
  templateUrl: './ring-avatar.html',
  styleUrl: './ring-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RingAvatar {}
