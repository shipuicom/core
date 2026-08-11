import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-steppers',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './steppers.html',
  styleUrl: './steppers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StepperComponent {}
