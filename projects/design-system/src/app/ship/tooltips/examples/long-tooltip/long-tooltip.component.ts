import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-long-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './long-tooltip.component.html',
  styleUrl: './long-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTooltipComponent {}
