import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseRadio } from './examples/base-radio/base-radio';
import { FlatRadio } from './examples/flat-radio/flat-radio';
import { OutlinedRadio } from './examples/outlined-radio/outlined-radio';
import { RadioSandbox } from './examples/radio-sandbox';
import { RaisedRadio } from './examples/raised-radio/raised-radio';
import { SimpleRadio } from './examples/simple-radio/simple-radio';

@Component({
  selector: 'app-radio-buttons-examples',
  imports: [Previewer, RadioSandbox, BaseRadio, SimpleRadio, OutlinedRadio, FlatRadio, RaisedRadio],
  templateUrl: './radio-buttons-examples.html',
  styleUrl: './radio-buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtonsExamples {}
