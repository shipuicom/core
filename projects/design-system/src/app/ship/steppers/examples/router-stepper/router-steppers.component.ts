import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShipRadioComponent, ShipStepperComponent } from 'ship-ui';

@Component({
  selector: 'app-router-steppers',
  standalone: true,
  imports: [ShipStepperComponent, ShipRadioComponent, RouterLink, RouterLinkActive],
  templateUrl: './router-steppers.component.html',
  styleUrl: './router-steppers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SteppersComponent {}
