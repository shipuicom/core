import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShipRadioComponent, ShipStepperComponent } from '@ship-ui/core';

@Component({
  selector: 'app-router-steppers',
  standalone: true,
  imports: [ShipStepperComponent, ShipRadioComponent, RouterLink, RouterLinkActive],
  templateUrl: './router-stepper.component.html',
  styleUrl: './router-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SteppersComponent {}
