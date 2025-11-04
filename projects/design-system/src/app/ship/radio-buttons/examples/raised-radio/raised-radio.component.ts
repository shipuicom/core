import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-raised-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './raised-radio.html',
  styleUrl: './raised-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedRadioComponent {
  active = signal(false);
}
