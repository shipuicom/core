import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-type-c-card',
  standalone: true,
  imports: [SparkleCardComponent],
  templateUrl: './type-c-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeCCardComponent {}
