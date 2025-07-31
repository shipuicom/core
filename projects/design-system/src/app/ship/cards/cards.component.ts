import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseCardComponent } from './examples/base-card/base-card.component';
import { CardSandboxComponent } from './examples/card-sandbox/card-sandbox.component';
import { ToggleCardDisallowedExampleComponent } from './examples/toggle-card-disallowed/toggle-card-disallowed.component';
import { ToggleCardExampleComponent } from './examples/toggle-card/toggle-card.component';
import { TypeACardComponent } from './examples/type-a-card/type-a-card.component';
import { TypeBCardComponent } from './examples/type-b-card/type-b-card.component';
import { TypeCCardComponent } from './examples/type-c-card/type-c-card.component';

@Component({
  selector: 'app-cards',
  imports: [
    CardSandboxComponent,
    PropertyViewerComponent,
    PreviewerComponent,
    BaseCardComponent,
    TypeACardComponent,
    TypeBCardComponent,
    TypeCCardComponent,
    ToggleCardExampleComponent,
    ToggleCardDisallowedExampleComponent,
  ],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CardsComponent {}
