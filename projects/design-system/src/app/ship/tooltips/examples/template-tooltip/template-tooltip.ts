import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-template-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './template-tooltip.html',
  styleUrl: './template-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltip {}
