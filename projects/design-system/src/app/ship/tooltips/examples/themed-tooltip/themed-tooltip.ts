import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTooltip } from '@ship-ui/core';

@Component({
  selector: 'app-themed-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './themed-tooltip.html',
  styleUrl: './themed-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemedTooltip {}
