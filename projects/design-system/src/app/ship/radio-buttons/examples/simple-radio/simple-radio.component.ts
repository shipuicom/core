import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from 'ship-ui';

@Component({
  selector: 'app-simple-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './simple-radio.component.html',
  styleUrl: './simple-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleRadioComponent {
  active = signal(false);
}
