import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-flat-button',
  imports: [ShipIconComponent, ShipButtonComponent],
  templateUrl: './flat-button.component.html',
  styleUrl: './flat-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatButtonComponent {}
