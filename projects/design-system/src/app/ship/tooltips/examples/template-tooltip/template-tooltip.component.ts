import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-template-tooltip',
  imports: [ShipIcon, ShipButtonComponent, ShipTooltip],
  templateUrl: './template-tooltip.component.html',
  styleUrl: './template-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltipComponent {}
