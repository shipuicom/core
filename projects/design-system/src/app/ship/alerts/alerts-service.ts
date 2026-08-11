import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShipAlertContainer, ShipAlertService } from '@ship-ui/core/ship-alert';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-alerts-service',
  imports: [ApiReference, Highlight, PropertyViewer, ShipButton, ShipAlertContainer],
  templateUrl: './alerts-service.html',
  styleUrl: './alerts-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlertsService {
  alertService = inject(ShipAlertService);

  codeShorthands = `import { Component, inject } from '@angular/core';
import { ShipAlertService } from '@ship-ui/core/ship-alert';

@Component({ /* ... */ })
export class SavePage {
  #alertService = inject(ShipAlertService);

  async save() {
    try {
      await this.api.save();
      this.#alertService.success('Changes saved');
    } catch (err) {
      // Falls back to a default message when null/undefined is passed
      this.#alertService.error(err.message);
    }
  }
}`;

  codeAddAlert = `this.#alertService.addAlert({
  type: 'warn',          // 'primary' | 'success' | 'warn' | 'error' | 'question'
  title: 'Storage almost full',
  content: 'You have used 90% of your quota.',
});`;

  codeHistory = `// Reactive list of alerts, newest first
alertHistory = this.#alertService.alertHistory;

// Toggle the history panel from anywhere
openHistory() {
  this.#alertService.setHidden(false);
  this.#alertService.alertHistoryIsOpen.set(true);
}`;
}
