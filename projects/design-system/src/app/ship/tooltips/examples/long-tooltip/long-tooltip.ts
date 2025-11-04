import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-long-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './long-tooltip.html',
  styleUrl: './long-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTooltip {}
