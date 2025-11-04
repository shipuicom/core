import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-simple-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './simple-button.html',
  styleUrl: './simple-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleButton {}
