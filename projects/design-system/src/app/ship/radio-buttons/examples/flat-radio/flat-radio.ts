import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-flat-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './flat-radio.html',
  styleUrl: './flat-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatRadio {
  active = signal(false);
}
