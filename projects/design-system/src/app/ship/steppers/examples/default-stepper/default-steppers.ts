import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadio, ShipStepper } from 'ship-ui';

@Component({
  selector: 'app-default-steppers',
  standalone: true,
  imports: [ShipStepper, ShipRadio],
  templateUrl: './default-steppers.html',
  styleUrls: ['./default-steppers.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultStepperComponent {
  activeStep = signal(0);
}
