import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseCardComponent } from './examples/base-card/base-card';
import { CardSandbox } from './examples/card-sandbox/card-sandbox';
import { ToggleCardDisallowedExampleComponent } from './examples/toggle-card-disallowed/toggle-card-disallowed';
import { ToggleCardExampleComponent } from './examples/toggle-card/toggle-card';
import { TypeACardComponent } from './examples/type-a-card/type-a-card';
import { TypeBCardComponent } from './examples/type-b-card/type-b-card';
import { TypeCCardComponent } from './examples/type-c-card/type-c-card';

@Component({
  selector: 'app-cards',
  imports: [
    ShipTabs,
    ApiReference,
    CardSandbox,
    PropertyViewer,
    Previewer,
    BaseCardComponent,
    TypeACardComponent,
    TypeBCardComponent,
    TypeCCardComponent,
    ToggleCardExampleComponent,
    ToggleCardDisallowedExampleComponent,
  ],
  templateUrl: './cards.html',
  styleUrl: './cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Cards {
  activeTab = signal('overview');
}
