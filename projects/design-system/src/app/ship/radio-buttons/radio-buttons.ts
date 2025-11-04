import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseRadio } from './examples/base-radio/base-radio';
import { FlatRadio } from './examples/flat-radio/flat-radio';
import { OutlinedRadio } from './examples/outlined-radio/outlined-radio';
import { RadioSandbox } from './examples/radio-sandbox';
import { RaisedRadio } from './examples/raised-radio/raised-radio';
import { SimpleRadio } from './examples/simple-radio/simple-radio';

@Component({
  selector: 'app-radio-buttons',
  imports: [
    Previewer,
    PropertyViewer,
    BaseRadio,
    SimpleRadio,
    OutlinedRadio,
    FlatRadio,
    RaisedRadio,
    RadioSandbox,
  ],
  templateUrl: './radio-buttons.html',
  styleUrl: './radio-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtons {}
