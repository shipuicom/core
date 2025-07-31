import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-outlined-button',
  imports: [ShipIconComponent, ShipButtonComponent],
  templateUrl: './outlined-button.component.html',
  styleUrl: './outlined-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedButtonComponent {}
