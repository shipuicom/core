import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-template-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './template-tooltip.component.html',
  styleUrl: './template-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltipComponent {}
