import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './base-button.component.html',
  styleUrl: './base-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonComponent {}
