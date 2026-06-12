import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { BasicTree } from './examples/basic-tree/basic-tree';
import { SortableTreeExample } from './examples/sortable-tree/sortable-tree';
import { TemplateTreeExample } from './examples/template-tree/template-tree';

@Component({
  selector: 'app-tree-showcase',
  standalone: true,
  imports: [
    BasicTree,
    SortableTreeExample,
    TemplateTreeExample,
    PropertyViewer,
    Previewer,
    Highlight,
    ShipTabs,
  ],
  templateUrl: './tree.html',
  styleUrl: './tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TreeShowcase {
  activeTab = signal('overview');

  basicCodeHtml = `<sh-tree [(items)]="nodes">
  <sh-icon openIcon>folder-open</sh-icon>
  <sh-icon closedIcon>folder</sh-icon>
</sh-tree>`;

  basicCodeTypescript = `import { Component, signal } from '@angular/core';
import { ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon } from '@ship-ui/core/ship-tree';
import { ShipIcon } from '@ship-ui/core/ship-icon';

interface TreeNode {
  id: string;
  name: string;
  type: 'item' | 'dir';
  parentId: string | null;
  isOpen?: boolean;
}

@Component({
  selector: 'app-basic-tree',
  standalone: true,
  imports: [ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipIcon],
  templateUrl: './basic-tree.html',
})
export class BasicTree {
  nodes = signal<TreeNode[]>([
    { id: '1', name: 'documents', type: 'dir', parentId: null, isOpen: true },
    { id: '1a', name: 'resume.pdf', type: 'item', parentId: '1' },
    { id: '1b', name: 'photos', type: 'dir', parentId: '1', isOpen: false },
    { id: '1b1', name: 'vacation.jpg', type: 'item', parentId: '1b' },
    { id: '2', name: 'downloads', type: 'dir', parentId: null, isOpen: false },
    { id: '2a', name: 'installer.dmg', type: 'item', parentId: '2' },
    { id: '3', name: 'todo-list.txt', type: 'item', parentId: null },
  ]);
}`;

  sortableCodeHtml = `<sh-tree [(items)]="nodes" [sortableManager]="manager">
  <sh-icon openIcon>folder-open</sh-icon>
  <sh-icon closedIcon>folder</sh-icon>

  <ng-template #dirTemplate let-node>
    <sh-tree-node>
      @if (node.isOpen) {
        <sh-icon size="small">folder-open</sh-icon>
      } @else {
        <sh-icon size="small">folder</sh-icon>
      }
      {{ node.name }}
    </sh-tree-node>
  </ng-template>

  <ng-template #nodeTemplate let-node>
    <sh-tree-node>
      <sh-icon size="small">file</sh-icon>
      {{ node.name }}
    </sh-tree-node>
  </ng-template>
</sh-tree>`;

  sortableCodeTypescript = `import { Component, signal } from '@angular/core';
import { ShipTree, ShipTreeNode, ShipTreeOpenIcon, ShipTreeClosedIcon } from '@ship-ui/core/ship-tree';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { createTreeSortableManager } from '@ship-ui/core/ship-sortable';

@Component({
  selector: 'app-sortable-tree',
  standalone: true,
  imports: [ShipTree, ShipTreeNode, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipIcon],
  templateUrl: './sortable-tree.html',
})
export class SortableTree {
  nodes = signal<TreeNode[]>([ ... ]);
  manager = createTreeSortableManager(this.nodes);
}`;

  templateCodeHtml = `<sh-tree 
  [(items)]="nodes"
  [getName]="getName"
  [isFolder]="isFolderNode"
>
  <!-- Custom Directory Template -->
  <ng-template #dirTemplate let-node>
    <sh-tree-node>
      @if (node.isOpen) {
        <sh-icon size="small">folder-open</sh-icon>
      } @else {
        <sh-icon size="small">folder</sh-icon>
      }
      {{ node.label }}
    </sh-tree-node>
  </ng-template>

  <!-- Custom File Template -->
  <ng-template #nodeTemplate let-node>
    <sh-tree-node>
      @if (node.label.endsWith('.log')) {
        <sh-icon size="small">scroll</sh-icon>
      } @else if (node.label.endsWith('.yml')) {
        <sh-icon size="small">file-code</sh-icon>
      } @else {
        <sh-icon size="small">file</sh-icon>
      }
      {{ node.label }}
      
      <sh-tree-node-actions>
        <button class="delete-btn" (click)="deleteNode(node, $event)" type="button">
          <sh-icon size="small">trash</sh-icon>
        </button>
      </sh-tree-node-actions>
    </sh-tree-node>
  </ng-template>
</sh-tree>`;

  stylingCode = `/* Customizing Tree variables */
sh-tree {
  --tree-bg: var(--base-2);
  --tree-bc: var(--base-3);
  --tree-color: var(--base-12);
  --tree-hover-bg: var(--base-3);
  --tree-active-bg: var(--base-4);
  --tree-selected-bg: var(--base-4);
  --tree-guide-color: var(--base-4);
  --tree-caret-color: var(--base-9);
  --tree-caret-hover-color: var(--base-12);
  --tree-icon-color: var(--base-9);
  --tree-icon-folder-color: var(--primary-8);
}`;
}
