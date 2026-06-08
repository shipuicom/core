import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipStepper } from '@ship-ui/core/ship-stepper';

@Component({
  selector: 'app-custom-steppers',
  standalone: true,
  imports: [ShipStepper],
  templateUrl: './custom-steppers.html',
  styleUrls: ['./custom-steppers.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSteppersComponent {
  activeStep = signal('0');
}
