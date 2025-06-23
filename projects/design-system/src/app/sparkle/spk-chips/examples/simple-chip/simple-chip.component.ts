import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleChipComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-simple-chip',
  imports: [SparkleIconComponent, SparkleChipComponent],
  templateUrl: './simple-chip.component.html',
  styleUrl: './simple-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleChipComponent {}
