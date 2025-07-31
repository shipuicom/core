import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent, ShipTooltipDirective } from '@ship-ui/core';

@Component({
  selector: 'app-template-tooltip',
  imports: [ShipIconComponent, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './template-tooltip.component.html',
  styleUrl: './template-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltipComponent {}
