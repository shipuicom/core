import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio } from '@ship-ui/core/ship-radio';

@Component({
  selector: 'app-basic-radio',
  standalone: true,
  imports: [ShipRadio],
  templateUrl: './basic-radio.html',
  styleUrl: './basic-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicRadio {
  active = signal(false);
}
