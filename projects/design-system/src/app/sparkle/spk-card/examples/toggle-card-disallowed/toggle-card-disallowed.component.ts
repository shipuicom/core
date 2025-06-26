import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleToggleCardComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-toggle-card-disallowed-example',
  standalone: true,
  imports: [SparkleToggleCardComponent],
  templateUrl: './toggle-card-disallowed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardDisallowedExampleComponent {}
