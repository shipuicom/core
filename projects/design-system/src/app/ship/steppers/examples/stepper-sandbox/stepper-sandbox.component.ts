import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroupComponent, ShipRadioComponent, ShipStepperComponent } from '@ship-ui/core';

@Component({
  selector: 'app-stepper-sandbox',
  standalone: true,
  imports: [ShipStepperComponent, ShipRadioComponent, ShipButtonGroupComponent],
  templateUrl: './stepper-sandbox.component.html',
  styleUrl: './stepper-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperSandboxComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  stepperClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));
  activeStep = signal(0);
}
