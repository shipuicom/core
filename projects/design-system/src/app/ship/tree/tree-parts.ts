import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-tree-parts',
  imports: [ApiReference, PropertyViewer],
  templateUrl: './tree-parts.html',
  styleUrl: './tree-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TreeParts {}
