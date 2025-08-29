import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonComponent } from 'ship-ui';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseButtonComponent } from './examples/base-button/base-button.component';
import { ButtonSandboxComponent } from './examples/button-sandbox/button-sandbox.component';
import { FlatButtonComponent } from './examples/flat-button/flat-button.component';
import { OutlinedButtonComponent } from './examples/outlined-button/outlined-button.component';
import { RaisedButtonComponent } from './examples/raised-button/raised-button.component';
import { SimpleButtonComponent } from './examples/simple-button/simple-button.component';

@Component({
  selector: 'app-buttons',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,

    ShipButtonComponent,

    ButtonSandboxComponent,
    BaseButtonComponent,
    OutlinedButtonComponent,
    SimpleButtonComponent,
    FlatButtonComponent,
    RaisedButtonComponent,
    PropertyViewerComponent,
  ],
  templateUrl: './buttons.component.html',
  styleUrl: './buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsComponent {
  isSmall = signal<boolean>(false);
  view = signal<'example' | 'code'>('example');

  example1 = `<button shButton>Default button</button>

<h1>hello world</h1>

<button shButton>Default button</button>`;
}
