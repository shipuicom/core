import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTooltip } from '@ship-ui/core';

@Component({
  selector: 'app-basic-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './basic-tooltip.html',
  styleUrl: './basic-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTooltip {}
