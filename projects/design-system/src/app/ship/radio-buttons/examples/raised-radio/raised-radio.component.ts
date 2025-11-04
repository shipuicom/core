import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-raised-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './raised-radio.component.html',
  styleUrl: './raised-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedRadioComponent {
  active = signal(false);
}
