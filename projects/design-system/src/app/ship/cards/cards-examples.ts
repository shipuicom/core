import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseCardComponent } from './examples/base-card/base-card';
import { CardSandbox } from './examples/card-sandbox/card-sandbox';
import { ToggleCardDisallowedExampleComponent } from './examples/toggle-card-disallowed/toggle-card-disallowed';
import { ToggleCardExampleComponent } from './examples/toggle-card/toggle-card';
import { TypeACardComponent } from './examples/type-a-card/type-a-card';
import { TypeBCardComponent } from './examples/type-b-card/type-b-card';
import { TypeCCardComponent } from './examples/type-c-card/type-c-card';

@Component({
  selector: 'app-cards-examples',
  imports: [
    Previewer,
    CardSandbox,
    BaseCardComponent,
    TypeACardComponent,
    TypeBCardComponent,
    TypeCCardComponent,
    ToggleCardExampleComponent,
    ToggleCardDisallowedExampleComponent,
  ],
  templateUrl: './cards-examples.html',
  styleUrl: './cards-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CardsExamples {}
