import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent } from '@ship-ui/core';

@Component({
  selector: 'app-raised-radio',
  standalone: true,
  imports: [ShipRadioComponent],
  templateUrl: './raised-radio.component.html',
  styleUrl: './raised-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedRadioComponent {
  active = signal(false);
}
