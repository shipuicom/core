import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseRadioComponent } from './examples/base-radio/base-radio.component';
import { FlatRadioComponent } from './examples/flat-radio/flat-radio.component';
import { OutlinedRadioComponent } from './examples/outlined-radio/outlined-radio.component';
import { RadioSandboxComponent } from './examples/radio-sandbox.component';
import { RaisedRadioComponent } from './examples/raised-radio/raised-radio.component';
import { SimpleRadioComponent } from './examples/simple-radio/simple-radio.component';

@Component({
  selector: 'app-radio-buttons',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    BaseRadioComponent,
    SimpleRadioComponent,
    OutlinedRadioComponent,
    FlatRadioComponent,
    RaisedRadioComponent,
    RadioSandboxComponent,
  ],
  templateUrl: './radio-buttons.component.html',
  styleUrl: './radio-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtonsComponent {}
