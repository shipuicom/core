import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent, SparkleToggleCardComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-card',
  imports: [SparkleCardComponent, SparkleToggleCardComponent],
  templateUrl: './spk-card.component.html',
  styleUrl: './spk-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkCardComponent {}
