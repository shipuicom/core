import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-event-cards',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './event-cards.html',
  styleUrl: './event-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventCards {}
