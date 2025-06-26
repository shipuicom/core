import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleToggleCardComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-toggle-card-example',
  standalone: true,
  imports: [SparkleToggleCardComponent],
  templateUrl: './toggle-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardExampleComponent {}
