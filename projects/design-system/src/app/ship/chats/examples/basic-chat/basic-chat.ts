import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipChat } from '@ship-ui/core/ship-chat';

@Component({
  selector: 'app-basic-chat-example',
  imports: [ShipChat, ShipAvatar],
  templateUrl: './basic-chat.html',
  styleUrl: './basic-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicChat {}
