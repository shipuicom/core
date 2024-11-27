import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent, SparkleTooltipComponent } from 'spk/public';

@Component({
  selector: 'app-spk-tooltip',
  imports: [SparkleButtonComponent, SparkleIconComponent, SparkleTooltipComponent],
  templateUrl: './spk-tooltip.component.html',
  styleUrl: './spk-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTooltipComponent {}
