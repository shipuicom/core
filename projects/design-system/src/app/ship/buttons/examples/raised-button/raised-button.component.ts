import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-raised-button',
  imports: [ShipIcon, ShipButtonComponent],
  templateUrl: './raised-button.component.html',
  styleUrl: './raised-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedButtonComponent {}
