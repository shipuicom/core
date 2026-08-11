import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-sortables-api',
  imports: [ApiReference, PropertyViewer],
  templateUrl: './sortables-api.html',
  styleUrl: './sortables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortablesApi {}
