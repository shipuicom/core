import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleChipComponent,
  SparkleDividerComponent,
  SparkleIconComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-chips',
  imports: [SparkleDividerComponent, SparkleChipComponent, SparkleIconComponent],
  templateUrl: './spk-chips.component.html',
  styleUrl: './spk-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkChipsComponent {}
