import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent } from 'ship-ui';

@Component({
  selector: 'app-outlined-radio',
  standalone: true,
  imports: [ShipRadioComponent],
  templateUrl: './outlined-radio.component.html',
  styleUrl: './outlined-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedRadioComponent {
  active = signal(false);
}
