import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-card',
  standalone: true,
  imports: [SparkleCardComponent],
  templateUrl: './spk-card.component.html',
  styleUrl: './spk-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkCardComponent {}
