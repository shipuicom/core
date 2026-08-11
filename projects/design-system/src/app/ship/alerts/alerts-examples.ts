import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { AlertsSandbox } from './examples/alerts-sandbox';
import { BaseAlert } from './examples/base-alert/base-alert';
import { FlatAlert } from './examples/flat-alert/flat-alert';
import { OutlinedAlert } from './examples/outlined-alert/outlined-alert';
import { RaisedAlert } from './examples/raised-alert/raised-alert';
import { SimpleAlert } from './examples/simple-alert/simple-alert';

@Component({
  selector: 'app-alerts-examples',
  imports: [Previewer, AlertsSandbox, BaseAlert, SimpleAlert, OutlinedAlert, FlatAlert, RaisedAlert],
  templateUrl: './alerts-examples.html',
  styleUrl: './alerts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlertsExamples {}
