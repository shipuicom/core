import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SparkleAlertService } from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { AlertsSandboxComponent } from './examples/alerts-sandbox.component';
import { BaseAlertComponent } from './examples/base-alert/base-alert.component';
import { FlatAlertComponent } from './examples/flat-alert/flat-alert.component';
import { OutlinedAlertComponent } from './examples/outlined-alert/outlined-alert.component';
import { RaisedAlertComponent } from './examples/raised-alert/raised-alert.component';
import { SimpleAlertComponent } from './examples/simple-alert/simple-alert.component';

@Component({
  selector: 'app-spk-alerts',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    AlertsSandboxComponent,
    BaseAlertComponent,
    SimpleAlertComponent,
    OutlinedAlertComponent,
    FlatAlertComponent,
    RaisedAlertComponent,
  ],
  templateUrl: './spk-alerts.component.html',
  styleUrl: './spk-alerts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkAlertsComponent {
  sparkleAlertService = inject(SparkleAlertService);

  count = 0;

  ngOnInit() {
    this.sparkleAlertService.addAlert({
      type: 'error',
      title: 'Error',
      content: 'This is an error',
    });
    this.sparkleAlertService.addAlert({
      type: 'primary',
      title: 'Info',
      content: 'This is an info',
    });

    setTimeout(() => {
      this.sparkleAlertService.addAlert({
        type: 'primary',
        title: 'Short info',
      });
    }, 5000);
  }

  addAlert() {
    this.count += 1;

    this.sparkleAlertService.addAlert({
      type: 'question',
      title: 'Yet another question? - ' + this.count,
    });
  }
}
