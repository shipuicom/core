import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseEventCard } from './examples/base-event-card/base-event-card';
import { EventCardSandbox } from './examples/event-card-sandbox/event-card-sandbox';
import { FlatEventCard } from './examples/flat-event-card/flat-event-card';
import { OutlinedEventCard } from './examples/outlined-event-card/outlined-event-card';
import { RaisedEventCard } from './examples/raised-event-card/raised-event-card';
import { SimpleEventCard } from './examples/simple-event-card/simple-event-card';

@Component({
  selector: 'app-event-cards',
  imports: [
    FormsModule,

    Previewer,
    PropertyViewer,

    EventCardSandbox,
    BaseEventCard,
    SimpleEventCard,
    OutlinedEventCard,
    FlatEventCard,
    RaisedEventCard,
  ],
  templateUrl: './event-cards.html',
  styleUrl: './event-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventCards {
  dynamicColor = signal('blue');
}
