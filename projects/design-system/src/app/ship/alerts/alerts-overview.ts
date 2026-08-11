import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShipAlertService } from '@ship-ui/core/ship-alert';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicAlert } from './examples/basic-alert/basic-alert';

@Component({
  selector: 'app-alerts-overview',
  imports: [Previewer, PropertyViewer, BasicAlert],
  templateUrl: './alerts-overview.html',
  styleUrl: './alerts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlertsOverview {
  shipAlertService = inject(ShipAlertService);

  // Demo the alert service by firing a few toasts when the page opens.
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
}
