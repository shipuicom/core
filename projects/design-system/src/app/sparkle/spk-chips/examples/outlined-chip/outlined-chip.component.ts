import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleChipComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-outlined-chip',
  imports: [SparkleIconComponent, SparkleChipComponent],
  templateUrl: './outlined-chip.component.html',
  styleUrl: './outlined-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedChipComponent {}
