import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseSortable } from './examples/base-sortable/base-sortable';
import { CrossListSortable } from './examples/cross-list-sortable/cross-list-sortable';
import { GridSortableExample } from './examples/grid-sortable/grid-sortable-example';
import { HandleSortable } from './examples/handle-sortable/handle-sortable';

const CONTENT_EXAMPLE = [
  {
    id: 'id1',
    header: 'Hello',
    content:
      'hello again, hello againhello againhello againhello againhello againhello againhello againhello againhello againhello againhello againhello again',
  },

  {
    id: 'id2',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id3',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id4',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id5',
    header: 'Hello',
    content: 'hello again',
  },

  {
    id: 'id6',
    header: 'Hello',
    content: 'hello again',
  },
];

@Component({
  selector: 'app-sortables',
  imports: [BaseSortable, CrossListSortable, GridSortableExample, HandleSortable, PropertyViewer, Previewer],
  templateUrl: './sortables.html',
  styleUrl: './sortables.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sortables {}
