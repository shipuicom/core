import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleChipComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-flat-chip',
  imports: [SparkleIconComponent, SparkleChipComponent],
  templateUrl: './flat-chip.component.html',
  styleUrl: './flat-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatChipComponent {}
