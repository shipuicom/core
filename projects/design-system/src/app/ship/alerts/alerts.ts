import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShipAlertService } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { AlertsSandbox } from './examples/alerts-sandbox';
import { BaseAlert } from './examples/base-alert/base-alert';
import { FlatAlert } from './examples/flat-alert/flat-alert';
import { OutlinedAlert } from './examples/outlined-alert/outlined-alert';
import { RaisedAlert } from './examples/raised-alert/raised-alert';
import { SimpleAlert } from './examples/simple-alert/simple-alert';

@Component({
  selector: 'app-alerts',
  imports: [Previewer, PropertyViewer, AlertsSandbox, BaseAlert, SimpleAlert, OutlinedAlert, FlatAlert, RaisedAlert],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Alerts {
  shipAlertService = inject(ShipAlertService);

  count = 0;

  ngOnInit() {
    this.shipAlertService.addAlert({
      type: 'error',
      title: 'Error',
      content: 'This is an error',
    });
    this.shipAlertService.addAlert({
      type: 'primary',
      title: 'Info',
      content: 'This is an info',
    });

    setTimeout(() => {
      this.shipAlertService.addAlert({
        type: 'primary',
        title: 'Short info',
      });
    }, 5000);
  }

  addAlert() {
    this.count += 1;

    this.shipAlertService.addAlert({
      type: 'question',
      title: 'Yet another question? - ' + this.count,
    });
  }
}
