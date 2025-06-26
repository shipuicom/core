import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseSortableComponent } from './examples/base-sortable/base-sortable.component';

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
  selector: 'app-spk-sortable',
  imports: [BaseSortableComponent, PropertyViewerComponent, PreviewerComponent],
  templateUrl: './spk-sortable.component.html',
  styleUrl: './spk-sortable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSortableComponent {}
