import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent, ShipTooltipDirective } from '@ship-ui/core';

@Component({
  selector: 'app-basic-tooltip',
  imports: [ShipIconComponent, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './basic-tooltip.component.html',
  styleUrl: './basic-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTooltipComponent {}
