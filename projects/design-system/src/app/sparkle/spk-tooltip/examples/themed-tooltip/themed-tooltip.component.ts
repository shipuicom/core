import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipDirective,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-themed-tooltip',
  imports: [SparkleIconComponent, SparkleButtonComponent, SparkleTooltipDirective],
  templateUrl: './themed-tooltip.component.html',
  styleUrl: './themed-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemedTooltipComponent {}
