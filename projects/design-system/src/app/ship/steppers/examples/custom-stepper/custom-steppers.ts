import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio, ShipStepper } from 'ship-ui';

@Component({
  selector: 'app-custom-steppers',
  standalone: true,
  imports: [ShipStepper, ShipRadio],
  templateUrl: './custom-steppers.html',
  styleUrls: ['./custom-steppers.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSteppersComponent {
  activeStep = signal(0);
}
