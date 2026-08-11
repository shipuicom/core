import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseEventCard } from './examples/base-event-card/base-event-card';
import { EventCardSandbox } from './examples/event-card-sandbox/event-card-sandbox';
import { FlatEventCard } from './examples/flat-event-card/flat-event-card';
import { OutlinedEventCard } from './examples/outlined-event-card/outlined-event-card';
import { RaisedEventCard } from './examples/raised-event-card/raised-event-card';
import { SimpleEventCard } from './examples/simple-event-card/simple-event-card';

@Component({
  selector: 'app-event-cards-examples',
  imports: [Previewer, EventCardSandbox, BaseEventCard, SimpleEventCard, OutlinedEventCard, FlatEventCard, RaisedEventCard],
  templateUrl: './event-cards-examples.html',
  styleUrl: './event-cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventCardsExamples {}
