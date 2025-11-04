import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-simple-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './simple-radio.html',
  styleUrl: './simple-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleRadio {
  active = signal(false);
}
