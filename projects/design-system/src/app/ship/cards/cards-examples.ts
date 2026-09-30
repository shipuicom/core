import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCardVariant } from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseCardComponent } from './examples/base-card/base-card';
import { CardSandbox } from './examples/card-sandbox/card-sandbox';
import { ToggleCardDisallowedExampleComponent } from './examples/toggle-card-disallowed/toggle-card-disallowed';
import { ToggleCardExampleComponent } from './examples/toggle-card/toggle-card';
import { TypeACardComponent } from './examples/type-a-card/type-a-card';
import { TypeBCardComponent } from './examples/type-b-card/type-b-card';
import { TypeCCardComponent } from './examples/type-c-card/type-c-card';
import { TypeDCardComponent } from './examples/type-d-card/type-d-card';

@Component({
  selector: 'app-cards-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    CardSandbox,
    BaseCardComponent,
    TypeACardComponent,
    TypeBCardComponent,
    TypeCCardComponent,
    TypeDCardComponent,
    ToggleCardExampleComponent,
    ToggleCardDisallowedExampleComponent,
  ],
  templateUrl: './cards-examples.html',
  styleUrl: './cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CardsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  variant = signal<ShipCardVariant>('type-a');
  disableToggle = signal(false);
}
