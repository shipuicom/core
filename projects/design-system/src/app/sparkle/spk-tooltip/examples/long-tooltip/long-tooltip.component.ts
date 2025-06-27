import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipDirective,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-long-tooltip',
  imports: [SparkleIconComponent, SparkleButtonComponent, SparkleTooltipDirective],
  templateUrl: './long-tooltip.component.html',
  styleUrl: './long-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTooltipComponent {}
