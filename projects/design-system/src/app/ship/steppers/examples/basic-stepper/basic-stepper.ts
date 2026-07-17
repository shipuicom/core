import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipStepper } from '@ship-ui/core/ship-stepper';

@Component({
  selector: 'app-basic-stepper',
  standalone: true,
  imports: [ShipStepper],
  templateUrl: './basic-stepper.html',
  styleUrl: './basic-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicStepper {
  activeStep = signal('0');
}
