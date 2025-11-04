import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-outlined-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './outlined-button.html',
  styleUrl: './outlined-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedButton {}
