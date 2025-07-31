import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent } from '@ship-ui/core';

@Component({
  selector: 'app-simple-radio',
  standalone: true,
  imports: [ShipRadioComponent],
  templateUrl: './simple-radio.component.html',
  styleUrl: './simple-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleRadioComponent {
  active = signal(false);
}
