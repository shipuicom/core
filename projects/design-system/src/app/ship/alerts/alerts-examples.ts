import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { AlertsSandbox } from './examples/alerts-sandbox';
import { BaseAlert } from './examples/base-alert/base-alert';
import { FlatAlert } from './examples/flat-alert/flat-alert';
import { OutlinedAlert } from './examples/outlined-alert/outlined-alert';
import { RaisedAlert } from './examples/raised-alert/raised-alert';
import { SimpleAlert } from './examples/simple-alert/simple-alert';

@Component({
  selector: 'app-alerts-examples',
  imports: [Previewer, ShipButtonGroup, AlertsSandbox, BaseAlert, SimpleAlert, OutlinedAlert, FlatAlert, RaisedAlert],
  templateUrl: './alerts-examples.html',
  styleUrl: './alerts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlertsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');
}
