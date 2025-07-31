import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent, ShipStepperComponent } from '@ship-ui/core';

@Component({
  selector: 'app-default-stepper',
  standalone: true,
  imports: [ShipStepperComponent, ShipRadioComponent],
  templateUrl: './default-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultStepperComponent {
  activeStep = signal(0);
}
