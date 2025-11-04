import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltipDirective } from 'ship-ui';

@Component({
  selector: 'app-template-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltipDirective],
  templateUrl: './template-tooltip.component.html',
  styleUrl: './template-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltipComponent {}
