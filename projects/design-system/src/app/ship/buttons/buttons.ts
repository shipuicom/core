import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseButton } from './examples/base-button/base-button';
import { BasicButton } from './examples/basic-button/basic-button';
import { ButtonSandbox } from './examples/button-sandbox/button-sandbox';
import { FlatButton } from './examples/flat-button/flat-button';
import { OutlinedButton } from './examples/outlined-button/outlined-button';
import { RaisedButton } from './examples/raised-button/raised-button';
import { SimpleButton } from './examples/simple-button/simple-button';

@Component({
  selector: 'app-buttons',
  imports: [
    ShipTabs,
    ApiReference,
    Previewer,
    PropertyViewer,

    // ShipButton,

    ButtonSandbox,
    BasicButton,
    BaseButton,
    OutlinedButton,
    SimpleButton,
    FlatButton,
    RaisedButton,
    PropertyViewer,
  ],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Buttons {
  activeTab = signal('overview');
  isSmall = signal<boolean>(false);
  view = signal<'example' | 'code'>('example');

  example1 = `<button shButton>Default button</button>

<h1>hello world</h1>

<button shButton>Default button</button>`;
}
