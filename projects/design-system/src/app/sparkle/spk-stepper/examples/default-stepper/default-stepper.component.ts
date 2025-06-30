import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleRadioComponent, SparkleStepperComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-default-stepper',
  standalone: true,
  imports: [SparkleStepperComponent, SparkleRadioComponent],
  templateUrl: './default-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultStepperComponent {
  activeStep = signal(0);
}
