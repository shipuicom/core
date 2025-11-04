import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-raised-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './raised-button.html',
  styleUrl: './raised-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedButton {}
