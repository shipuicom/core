import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SparkleButtonGroupComponent,
  SparkleRadioComponent,
  SparkleStepperComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-stepper-sandbox',
  standalone: true,
  imports: [SparkleStepperComponent, SparkleRadioComponent, SparkleButtonGroupComponent],
  templateUrl: './stepper-sandbox.component.html',
  styleUrl: './stepper-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperSandboxComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
  stepperClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));
  activeStep = signal(0);
}
