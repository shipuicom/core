import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseButton } from './examples/base-button/base-button';
import { ButtonSandbox } from './examples/button-sandbox/button-sandbox';
import { FlatButton } from './examples/flat-button/flat-button';
import { OutlinedButton } from './examples/outlined-button/outlined-button';
import { RaisedButton } from './examples/raised-button/raised-button';
import { SimpleButton } from './examples/simple-button/simple-button';

@Component({
  selector: 'app-buttons',
  imports: [
    Previewer,
    PropertyViewer,

    // ShipButton,

    ButtonSandbox,
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
  isSmall = signal<boolean>(false);
  view = signal<'example' | 'code'>('example');

  example1 = `<button shButton>Default button</button>

<h1>hello world</h1>

<button shButton>Default button</button>`;
}
