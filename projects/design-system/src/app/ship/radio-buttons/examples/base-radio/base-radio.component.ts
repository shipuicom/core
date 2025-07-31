import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-radio',
  standalone: true,
  imports: [ShipRadioComponent],
  templateUrl: './base-radio.component.html',
  styleUrl: './base-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseRadioComponent {
  active = signal(false);
}
