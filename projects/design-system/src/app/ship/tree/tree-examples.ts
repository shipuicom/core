import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { SortableTreeExample } from './examples/sortable-tree/sortable-tree';
import { TemplateTreeExample } from './examples/template-tree/template-tree';

@Component({
  selector: 'app-tree-examples',
  imports: [Previewer, Highlight, SortableTreeExample, TemplateTreeExample],
  templateUrl: './tree-examples.html',
  styleUrl: './tree-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TreeExamples {
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
}
