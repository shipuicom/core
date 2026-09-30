import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipChatVariant, ShipColor } from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { ChatInterface } from './examples/chat-interface/chat-interface';
import { ChatPage } from './examples/chat-page/chat-page';
import { ChatSandbox } from './examples/chat-sandbox/chat-sandbox';

@Component({
  selector: 'app-chats-examples',
  imports: [Previewer, ShipButtonGroup, ChatSandbox, ChatInterface, ChatPage],
  templateUrl: './chats-examples.html',
  styleUrl: './chats-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChatsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  variant = signal<ShipChatVariant>('');
  color = signal<ShipColor>('');
}
