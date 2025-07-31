import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent, ShipTooltipDirective } from '@ship-ui/core';

@Component({
  selector: 'app-themed-tooltip',
  imports: [ShipIconComponent, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './themed-tooltip.component.html',
  styleUrl: './themed-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemedTooltipComponent {}
