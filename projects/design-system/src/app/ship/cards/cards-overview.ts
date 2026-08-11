import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseCardComponent } from './examples/base-card/base-card';

@Component({
  selector: 'app-cards-overview',
  imports: [Previewer, PropertyViewer, BaseCardComponent],
  templateUrl: './cards-overview.html',
  styleUrl: './cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CardsOverview {}
