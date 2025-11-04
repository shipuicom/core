import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-base-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './base-radio.component.html',
  styleUrl: './base-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseRadioComponent {
  active = signal(false);
}
