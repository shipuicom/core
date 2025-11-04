import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-basic-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './basic-tooltip.html',
  styleUrl: './basic-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTooltip {}
