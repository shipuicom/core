import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleDividerComponent,
  SparkleIconComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-buttons',
  imports: [SparkleDividerComponent, SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './spk-buttons.component.html',
  styleUrl: './spk-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonsComponent {}
