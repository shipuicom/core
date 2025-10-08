import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipRadioComponent, ShipStepperComponent } from 'ship-ui';

@Component({
  selector: 'app-custom-steppers',
  standalone: true,
  imports: [ShipStepperComponent, ShipRadioComponent],
  templateUrl: './custom-steppers.component.html',
  styleUrls: ['./custom-steppers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSteppersComponent {
  activeStep = signal(0);
}
