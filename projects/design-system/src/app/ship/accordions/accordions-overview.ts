import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseAccordion } from './examples/base-accordion/base-accordion';

@Component({
  selector: 'app-accordions-overview',
  imports: [Previewer, PropertyViewer, BaseAccordion],
  templateUrl: './accordions-overview.html',
  styleUrl: './accordions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccordionsOverview {}
