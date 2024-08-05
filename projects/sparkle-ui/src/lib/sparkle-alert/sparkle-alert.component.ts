import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparkleAlertService } from './sparkle-alert.service';

export type SparkleAlertType = 'error' | 'success' | 'error' | 'warning' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'spk-alert',
  standalone: true,
  imports: [SparkleIconComponent],
  templateUrl: './sparkle-alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'type()',
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
