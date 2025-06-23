import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleChipComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-chip',
  imports: [SparkleIconComponent, SparkleChipComponent],
  templateUrl: './base-chip.component.html',
  styleUrl: './base-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseChipComponent {}
