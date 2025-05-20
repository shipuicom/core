import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleTooltipComponent_DEPRECATED,
  SparkleTooltipDirective,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-tooltip',
  imports: [
    FormsModule,
    SparkleButtonComponent,
    SparkleIconComponent,
    SparkleTooltipDirective,
    SparkleTooltipComponent_DEPRECATED,
  ],
  templateUrl: './spk-tooltip.component.html',
  styleUrl: './spk-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTooltipComponent {
  tooltipValue = signal<string>('Hello world');
}
