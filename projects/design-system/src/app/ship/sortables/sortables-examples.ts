import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { SortableTreeExample } from '../tree/examples/sortable-tree/sortable-tree';
import { BaseSortable } from './examples/base-sortable/base-sortable';
import { CrossListSortable } from './examples/cross-list-sortable/cross-list-sortable';
import { GridSortableExample } from './examples/grid-sortable/grid-sortable-example';
import { HandleSortable } from './examples/handle-sortable/handle-sortable';

@Component({
  selector: 'app-sortables-examples',
  imports: [Previewer, BaseSortable, CrossListSortable, GridSortableExample, HandleSortable, SortableTreeExample],
  templateUrl: './sortables-examples.html',
  styleUrl: './sortables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortablesExamples {}
