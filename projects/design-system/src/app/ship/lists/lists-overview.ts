import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicList } from './examples/basic-list/basic-list';

@Component({
  selector: 'app-lists-overview',
  imports: [Previewer, PropertyViewer, BasicList],
  templateUrl: './lists-overview.html',
  styleUrl: './lists-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsOverview {}
