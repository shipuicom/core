import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-card',
  standalone: true,
  imports: [SparkleCardComponent],
  templateUrl: './base-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCardComponent {}
