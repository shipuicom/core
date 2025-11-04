import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-themed-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltip],
  templateUrl: './themed-tooltip.component.html',
  styleUrl: './themed-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemedTooltipComponent {}
