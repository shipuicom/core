import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxAccordion } from './examples/sandbox-accordion/sandbox-accordion';
import { BaseAccordion } from './examples/base-accordion/base-accordion';
import { TypeBAccordion } from './examples/type-b-accordion/type-b-accordion';

@Component({
  selector: 'app-accordions',
  imports: [
    ShipTabs,
    ApiReference,
    Previewer,
    PropertyViewer,
    SandboxAccordion,
    BaseAccordion,
    TypeBAccordion,
  ],
  templateUrl: './accordions.html',
  styleUrl: './accordions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Accordions {
  activeTab = signal('overview');
}
