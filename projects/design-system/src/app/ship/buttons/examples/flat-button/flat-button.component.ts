import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-flat-button',
  imports: [ShipIcon, ShipButtonComponent],
  templateUrl: './flat-button.component.html',
  styleUrl: './flat-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatButtonComponent {}
