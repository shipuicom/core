import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCardComponent } from '../../../../ship-ui/src/public-api';

@Component({
  selector: 'app-property-viewer',
  imports: [ShipCardComponent],
  templateUrl: './property-viewer.component.html',
  styleUrl: './property-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyViewerComponent {}
