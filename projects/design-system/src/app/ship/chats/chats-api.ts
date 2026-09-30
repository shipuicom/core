import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-chats-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipChat" />`,
  styleUrl: './chats-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChatsApi {}
