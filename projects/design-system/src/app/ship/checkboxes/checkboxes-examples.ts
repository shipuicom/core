import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseCheckbox } from './examples/base-checkbox/base-checkbox';
import { CheckboxSandbox } from './examples/checkbox-sandbox';
import { FlatCheckbox } from './examples/flat-checkbox/flat-checkbox';
import { OutlinedCheckbox } from './examples/outlined-checkbox/outlined-checkbox';
import { RaisedCheckbox } from './examples/raised-checkbox/raised-checkbox';
import { SignalFormCheckbox } from './examples/signal-form-checkbox/signal-form-checkbox';
import { SimpleCheckbox } from './examples/simple-checkbox/simple-checkbox';

@Component({
  selector: 'app-checkboxes-examples',
  imports: [Previewer, CheckboxSandbox, BaseCheckbox, SimpleCheckbox, OutlinedCheckbox, FlatCheckbox, RaisedCheckbox, SignalFormCheckbox],
  templateUrl: './checkboxes-examples.html',
  styleUrl: './checkboxes-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxesExamples {}
