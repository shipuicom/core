import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from '@ship-ui/core/ship-radio';

@Component({
  selector: 'app-base-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './base-radio.html',
  styleUrl: './base-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseRadio {
  active = signal(false);
}
