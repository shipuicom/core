import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltipDirective } from 'ship-ui';

@Component({
  selector: 'app-themed-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './themed-tooltip.component.html',
  styleUrl: './themed-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemedTooltipComponent {}
