import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-simple-button',
  imports: [ShipIcon, ShipButtonComponent],
  templateUrl: './simple-button.component.html',
  styleUrl: './simple-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleButtonComponent {}
