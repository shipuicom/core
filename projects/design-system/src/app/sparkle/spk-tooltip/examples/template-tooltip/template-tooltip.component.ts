import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipDirective,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-template-tooltip',
  imports: [SparkleIconComponent, SparkleButtonComponent, SparkleTooltipDirective],
  templateUrl: './template-tooltip.component.html',
  styleUrl: './template-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltipComponent {}
