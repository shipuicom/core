import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicChat } from './examples/basic-chat/basic-chat';
import { ChatInterface } from './examples/chat-interface/chat-interface';
import { ChatPage } from './examples/chat-page/chat-page';

@Component({
  selector: 'app-chats-overview',
  imports: [Previewer, BasicChat, ChatInterface, ChatPage],
  templateUrl: './chats-overview.html',
  styleUrl: './chats-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChatsOverview {}
