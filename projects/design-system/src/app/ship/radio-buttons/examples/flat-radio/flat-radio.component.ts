import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent } from 'ship-ui';

@Component({
  selector: 'app-flat-radio',
  standalone: true,
  imports: [ShipRadioComponent],
  templateUrl: './flat-radio.component.html',
  styleUrl: './flat-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatRadioComponent {
  active = signal(false);
}
