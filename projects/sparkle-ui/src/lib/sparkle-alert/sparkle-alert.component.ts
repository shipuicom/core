import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SparkleAlertService } from './sparkle-alert.service';

export type SparkleAlertType = 'error' | 'success' | 'error' | 'warning' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'sparkle-alert',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './sparkle-alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sparkle-alert]': 'true',
    '[class]': '"sparkle-alert-" + type()',
  },
})
export class SparkleAlertComponent {
  _el = inject(ElementRef);

  alertService = input<SparkleAlertService | null>(null);
  type = input<SparkleAlertType>('error');
  id = input<string | null>(null);

  removeAlert() {
    if (this.id() && this.alertService()) {
      this.alertService()?.removeAlert(this.id() as string);
    }
  }
}
