import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipStepper } from '@ship-ui/core/ship-stepper';

@Component({
  selector: 'app-stepper-sandbox',
  standalone: true,
  imports: [ShipStepper],
  templateUrl: './stepper-sandbox.html',
  styleUrl: './stepper-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  activeStep = signal('0');
}
