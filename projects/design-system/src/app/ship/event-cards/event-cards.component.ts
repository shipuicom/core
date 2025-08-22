import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseEventCardComponent } from './examples/base-event-card/base-event-card.component';
import { EventCardSandboxComponent } from './examples/event-card-sandbox/event-card-sandbox.component';
import { FlatEventCardComponent } from './examples/flat-event-card/flat-event-card.component';
import { OutlinedEventCardComponent } from './examples/outlined-event-card/outlined-event-card.component';
import { RaisedEventCardComponent } from './examples/raised-event-card/raised-event-card.component';
import { SimpleEventCardComponent } from './examples/simple-event-card/simple-event-card.component';

@Component({
  selector: 'app-event-cards',
  imports: [
    FormsModule,

    PreviewerComponent,
    PropertyViewerComponent,

    EventCardSandboxComponent,
    BaseEventCardComponent,
    SimpleEventCardComponent,
    OutlinedEventCardComponent,
    FlatEventCardComponent,
    RaisedEventCardComponent,
  ],
  templateUrl: './event-cards.component.html',
  styleUrl: './event-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventCardsComponent {
  dynamicColor = signal('blue');
}
