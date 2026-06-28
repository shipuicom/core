import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

@Component({
  selector: 'app-long-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './long-tooltip.html',
  styleUrl: './long-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTooltip {}
