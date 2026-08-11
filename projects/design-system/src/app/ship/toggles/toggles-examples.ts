import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseToggle } from './examples/base-toggle/base-toggle';
import { FlatToggle } from './examples/flat-toggle/flat-toggle';
import { OutlinedToggle } from './examples/outlined-toggle/outlined-toggle';
import { RaisedToggle } from './examples/raised-toggle/raised-toggle';
import { SimpleToggle } from './examples/simple-toggle/simple-toggle';
import { ToggleSandbox } from './examples/toggle-sandbox';

@Component({
  selector: 'app-toggles-examples',
  imports: [Previewer, ToggleSandbox, BaseToggle, SimpleToggle, OutlinedToggle, FlatToggle, RaisedToggle],
  templateUrl: './toggles-examples.html',
  styleUrl: './toggles-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TogglesExamples {}
