import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-long-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltip],
  templateUrl: './long-tooltip.component.html',
  styleUrl: './long-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTooltipComponent {}
