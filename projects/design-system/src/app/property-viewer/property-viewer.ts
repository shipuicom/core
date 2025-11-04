import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipCard } from 'ship-ui';

@Component({
  selector: 'app-property-viewer',
  imports: [ShipCard],
  templateUrl: './property-viewer.html',
  styleUrl: './property-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyViewer {}
