import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-spotlight-api',
  imports: [ApiReference, PropertyViewer],
  templateUrl: './spotlight-api.html',
  styleUrl: './spotlight-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightApi {}
