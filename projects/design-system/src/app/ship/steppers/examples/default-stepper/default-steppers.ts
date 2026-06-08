import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipStepper } from '@ship-ui/core/ship-stepper';

@Component({
  selector: 'app-default-steppers',
  standalone: true,
  imports: [ShipStepper],
  templateUrl: './default-steppers.html',
  styleUrls: ['./default-steppers.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultStepperComponent {
  activeStep = signal('0');
}
