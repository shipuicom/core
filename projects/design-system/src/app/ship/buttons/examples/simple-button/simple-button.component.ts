import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-simple-button',
  imports: [ShipIconComponent, ShipButtonComponent],
  templateUrl: './simple-button.component.html',
  styleUrl: './simple-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleButtonComponent {}
