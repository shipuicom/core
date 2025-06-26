import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-type-b-card',
  standalone: true,
  imports: [SparkleCardComponent],
  templateUrl: './type-b-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBCardComponent {}
