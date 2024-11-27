import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  SparkleAlertComponent,
  SparkleAlertService,
  SparkleDividerComponent,
  SparkleIconComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-alerts',
  imports: [SparkleDividerComponent, SparkleIconComponent, SparkleAlertComponent],
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
