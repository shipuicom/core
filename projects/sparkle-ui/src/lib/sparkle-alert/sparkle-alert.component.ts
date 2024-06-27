import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewEncapsulation, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SparkleAlertService } from './sparkle-alert.service';

export type SparkleAlertType = 'error' | 'success' | 'error' | 'warning' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'sparkle-alert',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './sparkle-alert.component.html',
  styleUrl: './sparkle-alert.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sparkle-alert]': 'true',
    '[class]': 'typeClass',
  },
})
export class SparkleAlertComponent {
  private sparkleAlertService = inject(SparkleAlertService);

  _el = inject(ElementRef);
  _type: SparkleAlertType = 'error';
  typeClass = 'sparkle-alert-error';

  @Input() set type(value: SparkleAlertType) {
    this._type = value;
    this.typeClass = 'sparkle-alert-' + value;
  }

  id = input<string>();

  removeAlert() {
    if (this.id()) {
      this.sparkleAlertService.removeAlert(this.id() as string);
    }
  }
}
