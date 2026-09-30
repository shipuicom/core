import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseEventCard } from './examples/base-event-card/base-event-card';
import { EventCardSandbox } from './examples/event-card-sandbox/event-card-sandbox';
import { FlatEventCard } from './examples/flat-event-card/flat-event-card';
import { OutlinedEventCard } from './examples/outlined-event-card/outlined-event-card';
import { RaisedEventCard } from './examples/raised-event-card/raised-event-card';
import { SimpleEventCard } from './examples/simple-event-card/simple-event-card';

@Component({
  selector: 'app-event-cards-examples',
  imports: [
    FormsModule,
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    EventCardSandbox,
    BaseEventCard,
    SimpleEventCard,
    OutlinedEventCard,
    FlatEventCard,
    RaisedEventCard,
  ],
  templateUrl: './event-cards-examples.html',
  styleUrl: './event-cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventCardsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');
  useDynamicColor = signal(false);
  dynamicColor = signal('#2f54eb');
}
