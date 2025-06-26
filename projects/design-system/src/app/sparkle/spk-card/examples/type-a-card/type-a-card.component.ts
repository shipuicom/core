import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-type-a-card',
  standalone: true,
  imports: [SparkleCardComponent],
  templateUrl: './type-a-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeACardComponent {}
