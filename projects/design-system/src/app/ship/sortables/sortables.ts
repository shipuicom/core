import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
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
  imports: [BaseSortable, CrossListSortable, GridSortableExample, HandleSortable, PropertyViewer, Previewer, Highlight],
  templateUrl: './sortables.html',
  styleUrl: './sortables.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sortables {
  exampleCode = `<sh-list [shSortable]="manager">
  @for (item of items(); track $index) {
    <div item [draggable]="true">
      {{ item.name }}
    </div>
  }
</sh-list>`;

  crossListCodeTypescript = `
todoList = signal(['Implement Grids', 'Implement multiple boards', 'Refactor drag drop core']);
doneList = signal(['Read documentation', 'Setup ship-ui workspace']);

manager = createSortableManager({
  todo: this.todoList,
  done: this.doneList,
});
  `;

  crossListCode = `<!-- List 1 (connected via sortableGroup) -->
<div [shSortable]="manager" sortableGroup="todo">
  @for (item of todoList(); track item) {
    <div draggable="true">{{ item }}</div>
  }
</div>

<!-- List 2 -->
<div [shSortable]="manager" sortableGroup="done">
  @for (item of doneList(); track item) {
    <div draggable="true">{{ item }}</div>
  }
</div>`;
}
