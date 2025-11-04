import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-outlined-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './outlined-radio.html',
  styleUrl: './outlined-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedRadio {
  active = signal(false);
}
