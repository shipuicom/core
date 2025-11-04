import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShipRadio, ShipStepper } from 'ship-ui';

@Component({
  selector: 'app-router-steppers',
  standalone: true,
  imports: [ShipStepper, ShipRadio, RouterLink, RouterLinkActive],
  templateUrl: './router-steppers.component.html',
  styleUrl: './router-steppers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SteppersComponent {}
