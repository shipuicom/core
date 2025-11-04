import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-flat-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './flat-button.html',
  styleUrl: './flat-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatButton {}
