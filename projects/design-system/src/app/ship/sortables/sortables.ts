import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseSortable } from './examples/base-sortable/base-sortable';
import { CrossListSortable } from './examples/cross-list-sortable/cross-list-sortable';
import { GridSortableExample } from './examples/grid-sortable/grid-sortable-example';
import { HandleSortable } from './examples/handle-sortable/handle-sortable';
import { SortableTreeExample } from '../tree/examples/sortable-tree/sortable-tree';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

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
  imports: [
    BaseSortable,
    CrossListSortable,
    GridSortableExample,
    HandleSortable,
    SortableTreeExample,
    PropertyViewer,
    Previewer,
    Highlight,
    ShipTabs,
  ],
  templateUrl: './sortables.html',
  styleUrl: './sortables.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sortables {
  activeTab = signal('overview');
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

  treeCodeHtml = `<!-- Single flat container, mode set to tree -->
<div 
  [shSortable]="treeManager"
  [treeItems]="treeManager.visibleNodes()"
  sortingMode="tree"
>
  @for (node of treeManager.visibleNodes(); track node.id) {
    <div 
      draggable="true"
      [attr.sortable-dir]="node.type === 'dir' ? 'true' : null"
      [style.padding-left.px]="getNodeDepth(node) * 16"
    >
      {{ node.name }}
    </div>
  }
</div>`;

  treeCodeTypescript = `import { createTreeSortableManager } from '@ship-ui/core/ship-sortable';

interface TreeNode {
  id: string;
  name: string;
  type: 'item' | 'dir';
  parentId: string | null;
  isOpen?: boolean; // Optional boolean property determines folder open state
}

nodes = signal<TreeNode[]>([ ... ]);
treeManager = createTreeSortableManager(this.nodes);`;

  codeStylingExample = `/* Customizing Tree Drop Indicators */
.sh-sortable-tree {
  // Styles applied to folder node when hovering in the middle
  .drop-inside {
    background: var(--primary-3) !important;
    outline: 2px solid var(--primary-8) !important;
  }
  
  // Insertion line when hovering near the top
  .drop-before::before {
    background: var(--primary-8) !important;
    height: 2px;
  }
  
  // Insertion line when hovering near the bottom
  .drop-after::after {
    background: var(--primary-8) !important;
    height: 2px;
  }
}`;
}
