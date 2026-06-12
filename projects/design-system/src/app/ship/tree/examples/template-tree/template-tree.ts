import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTree, ShipTreeNode, ShipTreeNodeActions } from '@ship-ui/core/ship-tree';

interface CustomNode {
  id: string;
  label: string;
  kind: 'dir' | 'item';
  parentId: string | null;
  isOpen?: boolean;
}

@Component({
  selector: 'app-template-tree-example',
  standalone: true,
  imports: [ShipTree, ShipTreeNode, ShipTreeNodeActions, ShipIcon],
  templateUrl: './template-tree.html',
  styleUrl: './template-tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTreeExample {
  nodes = signal<CustomNode[]>([
    { id: '1', label: 'production-server', kind: 'dir', parentId: null, isOpen: true },
    { id: '1a', label: 'database-migration.log', kind: 'item', parentId: '1' },
    { id: '1b', label: 'docker-compose.yml', kind: 'item', parentId: '1' },
    { id: '2', label: 'staging-server', kind: 'dir', parentId: null, isOpen: false },
    { id: '2a', label: 'error.log', kind: 'item', parentId: '2' },
  ]);

  getName = (node: CustomNode) => node.label;
  isFolderNode = (node: CustomNode) => node.kind === 'dir';

  deleteNode(node: CustomNode, event: MouseEvent) {
    event.stopPropagation();
    this.nodes.update((list) => list.filter((n) => n.id !== node.id && n.parentId !== node.id));
  }
}
