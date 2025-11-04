import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './base-button.html',
  styleUrl: './base-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButton {}
