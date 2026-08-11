import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicEventCard } from './examples/basic-event-card/basic-event-card';

@Component({
  selector: 'app-event-cards-overview',
  imports: [Previewer, PropertyViewer, BasicEventCard],
  templateUrl: './event-cards-overview.html',
  styleUrl: './event-cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventCardsOverview {}
