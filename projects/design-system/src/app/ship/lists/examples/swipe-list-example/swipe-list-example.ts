import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipListItemSwipe } from '@ship-ui/core/ship-list-item-swipe';

const MESSAGES = [
  { id: 1, from: 'Nova Kim', subject: 'Design tokens are live', time: '09:12' },
  { id: 2, from: 'Ravi Patel', subject: 'Sortable review notes', time: '10:47' },
  { id: 3, from: 'Ida Sørensen', subject: 'Lunch on Thursday?', time: '11:03' },
  { id: 4, from: 'CI Bot', subject: 'main is green again', time: '12:30' },
];

type Message = (typeof MESSAGES)[0];

@Component({
  selector: 'app-swipe-list-example',
  standalone: true,
  imports: [ShipList, ShipListItemSwipe, ShipIcon],
  templateUrl: './swipe-list-example.html',
  styleUrl: './swipe-list-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipeListExample {
  messages = signal(MESSAGES);
  lastAction = signal('');

  onSwipeOpen(side: 'left' | 'right', message: Message) {
    this.lastAction.set(`Opened ${side} on "${message.subject}"`);
  }

  archive(message: Message) {
    this.messages.update((list) => list.filter((m) => m.id !== message.id));
    this.lastAction.set(`Archived "${message.subject}"`);
  }

  remove(message: Message) {
    this.messages.update((list) => list.filter((m) => m.id !== message.id));
    this.lastAction.set(`Deleted "${message.subject}"`);
  }

  reset() {
    this.messages.set(MESSAGES);
    this.lastAction.set('');
  }
}
