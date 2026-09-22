import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';

@Component({
  selector: 'app-basic-avatar',
  imports: [ShipAvatar],
  templateUrl: './basic-avatar.html',
  styleUrl: './basic-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAvatar {}
