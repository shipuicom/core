import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltipDirective } from 'ship-ui';

@Component({
  selector: 'app-basic-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './basic-tooltip.component.html',
  styleUrl: './basic-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTooltipComponent {}
