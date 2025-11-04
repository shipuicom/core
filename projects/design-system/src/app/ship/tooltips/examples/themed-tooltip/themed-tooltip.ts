import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-themed-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './themed-tooltip.html',
  styleUrl: './themed-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemedTooltip {}
