import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from 'spk/public';
import SparkleToggleCardComponent from '../../../../../sparkle-ui/src/lib/sparkle-toggle-card/sparkle-toggle-card.component';

@Component({
  selector: 'app-spk-card',
  imports: [SparkleCardComponent, SparkleToggleCardComponent],
  templateUrl: './spk-card.component.html',
  styleUrl: './spk-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkCardComponent {}
