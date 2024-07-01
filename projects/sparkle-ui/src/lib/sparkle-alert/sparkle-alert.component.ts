import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SparkleAlertService } from './sparkle-alert.service';

export type SparkleAlertType = 'error' | 'success' | 'error' | 'warning' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'sparkle-alert',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './sparkle-alert.component.html',
  styleUrl: './sparkle-alert.component.scss',
  // encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // host: {
  //   '[class.sparkle-alert]': 'true',
  //   '[class]': 'typeClass',
  // },
})
export class SparkleAlertComponent {
  _type: SparkleAlertType = 'error';
  typeClass = 'sparkle-alert-error';

  @Input() alertService: SparkleAlertService | null = null;
  @Input() set type(value: SparkleAlertType) {
    this._type = value;
    this.typeClass = 'sparkle-alert-' + value;
  }

  @Input() id: string | null = null;

  constructor(public _el: ElementRef) {}

  removeAlert() {
    if (this.id && this.alertService) {
      this.alertService.removeAlert(this.id as string);
    }
  }
}
