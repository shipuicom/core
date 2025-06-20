import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseButtonComponent } from './examples/base-button/base-button.component';
import { ButtonSandboxComponent } from './examples/button-sandbox/button-sandbox.component';
import { FlatButtonComponent } from './examples/flat-button/flat-button.component';
import { OutlinedButtonComponent } from './examples/outlined-button/outlined-button.component';
import { RaisedButtonComponent } from './examples/raised-button/raised-button.component';
import { SimpleButtonComponent } from './examples/simple-button/simple-button.component';

@Component({
  selector: 'app-spk-buttons',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,

    ButtonSandboxComponent,
    BaseButtonComponent,
    OutlinedButtonComponent,
    SimpleButtonComponent,
    FlatButtonComponent,
    RaisedButtonComponent,
    PropertyViewerComponent,
  ],
  templateUrl: './spk-buttons.component.html',
  styleUrl: './spk-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonsComponent {
  isSmall = signal<boolean>(false);
  view = signal<'example' | 'code'>('example');

  example1 = `<button spk-button>Default button</button>

<h1>hello world</h1>

<button spk-button>Default button</button>`;
}
