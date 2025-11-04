import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseButtonComponent } from './examples/base-button/base-button.component';
import { ButtonSandboxComponent } from './examples/button-sandbox/button-sandbox.component';
import { FlatButtonComponent } from './examples/flat-button/flat-button.component';
import { OutlinedButtonComponent } from './examples/outlined-button/outlined-button.component';
import { RaisedButtonComponent } from './examples/raised-button/raised-button.component';
import { SimpleButtonComponent } from './examples/simple-button/simple-button.component';

@Component({
  selector: 'app-buttons',
  imports: [
    Previewer,
    PropertyViewer,

    // ShipButton,

    ButtonSandboxComponent,
    BaseButtonComponent,
    OutlinedButtonComponent,
    SimpleButtonComponent,
    FlatButtonComponent,
    RaisedButtonComponent,
    PropertyViewer,
  ],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsComponent {
  isSmall = signal<boolean>(false);
  view = signal<'example' | 'code'>('example');

  example1 = `<button shButton>Default button</button>

<h1>hello world</h1>

<button shButton>Default button</button>`;
}
