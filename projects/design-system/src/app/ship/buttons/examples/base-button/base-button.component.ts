import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-button',
  imports: [ShipIcon, ShipButtonComponent],
  templateUrl: './base-button.component.html',
  styleUrl: './base-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonComponent {}
