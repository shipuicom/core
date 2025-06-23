import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleChipComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-chip',
  imports: [SparkleIconComponent, SparkleChipComponent],
  templateUrl: './raised-chip.component.html',
  styleUrl: './raised-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedChipComponent {}
