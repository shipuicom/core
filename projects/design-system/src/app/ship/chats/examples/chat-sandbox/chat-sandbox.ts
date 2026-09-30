import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipChatVariant, ShipColor } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipChat } from '@ship-ui/core/ship-chat';
import { ShipChip } from '@ship-ui/core/ship-chip';

@Component({
  selector: 'app-chat-sandbox',
  imports: [ShipChat, ShipAvatar, ShipChip],
  templateUrl: './chat-sandbox.html',
  styleUrl: './chat-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatSandbox {
  variant = input<ShipChatVariant>('');
  color = input<ShipColor>('');
}
