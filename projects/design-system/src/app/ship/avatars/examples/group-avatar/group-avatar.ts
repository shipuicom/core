import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAvatar, ShipAvatarGroup } from '@ship-ui/core/ship-avatar';
import { ShipButton } from '@ship-ui/core/ship-button';

const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Ken Thompson', 'Barbara Liskov'];

@Component({
  selector: 'app-group-avatar',
  imports: [ShipAvatar, ShipAvatarGroup, ShipButton],
  templateUrl: './group-avatar.html',
  styleUrl: './group-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupAvatar {
  people = signal(PEOPLE.slice(0, 5));

  add() {
    this.people.update((list) => (list.length < PEOPLE.length ? PEOPLE.slice(0, list.length + 1) : list));
  }

  remove() {
    this.people.update((list) => list.slice(0, -1));
  }
}
