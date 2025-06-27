import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipDirective,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-basic-tooltip',
  imports: [SparkleIconComponent, SparkleButtonComponent, SparkleTooltipDirective],
  templateUrl: './basic-tooltip.component.html',
  styleUrl: './basic-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTooltipComponent {}
