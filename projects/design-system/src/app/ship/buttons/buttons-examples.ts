import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseButton } from './examples/base-button/base-button';
import { ButtonSandbox } from './examples/button-sandbox/button-sandbox';
import { FlatButton } from './examples/flat-button/flat-button';
import { OutlinedButton } from './examples/outlined-button/outlined-button';
import { RaisedButton } from './examples/raised-button/raised-button';
import { SimpleButton } from './examples/simple-button/simple-button';

@Component({
  selector: 'app-buttons-examples',
  imports: [Previewer, ButtonSandbox, BaseButton, SimpleButton, OutlinedButton, FlatButton, RaisedButton],
  templateUrl: './buttons-examples.html',
  styleUrl: './buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsExamples {}
