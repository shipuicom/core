import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleCardComponent } from '../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-property-viewer',
  imports: [SparkleCardComponent],
  templateUrl: './property-viewer.component.html',
  styleUrl: './property-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyViewerComponent {}
