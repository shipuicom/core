import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent, ShipTooltipDirective } from 'ship-ui';

@Component({
  selector: 'app-long-tooltip',
  imports: [ShipIconComponent, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './long-tooltip.component.html',
  styleUrl: './long-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTooltipComponent {}
