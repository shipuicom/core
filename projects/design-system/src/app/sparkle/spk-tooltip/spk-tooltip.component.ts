import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-tooltip',
  standalone: true,
  imports: [SparkleButtonComponent, SparkleIconComponent, SparkleTooltipComponent],
  templateUrl: './spk-tooltip.component.html',
  styleUrl: './spk-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTooltipComponent {}
