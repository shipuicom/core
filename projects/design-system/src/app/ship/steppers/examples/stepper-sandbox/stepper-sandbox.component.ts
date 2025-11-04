import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroup, ShipRadio, ShipStepper } from 'ship-ui';

@Component({
  selector: 'app-stepper-sandbox',
  standalone: true,
  imports: [ShipStepper, ShipRadio, ShipButtonGroup],
  templateUrl: './stepper-sandbox.component.html',
  styleUrl: './stepper-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperSandboxComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  stepperClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));
  activeStep = signal(0);
}
