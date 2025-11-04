import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { CardSandbox } from './examples/card-sandbox/card-sandbox';
import { ToggleCardDisallowedExampleComponent } from './examples/toggle-card-disallowed/toggle-card-disallowed';
import { ToggleCardExampleComponent } from './examples/toggle-card/toggle-card';
import { TypeACardComponent } from './examples/type-a-card/type-a-card';
import { TypeBCardComponent } from './examples/type-b-card/type-b-card';
import { TypeCCardComponent } from './examples/type-c-card/type-c-card';

@Component({
  selector: 'app-cards',
  imports: [
    CardSandbox,
    PropertyViewer,
    Previewer,
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
export default class Cards {}
