import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTree, ShipTreeNode, ShipTreeNodeActions } from '@ship-ui/core/ship-tree';

interface CustomNode {
  uuid: string;
  label: string;
  kind: 'dir' | 'item';
  ownerUuid: string | null;
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
    { uuid: '1', label: 'production-server', kind: 'dir', ownerUuid: null, isOpen: true },
    { uuid: '1a', label: 'database-migration.log', kind: 'item', ownerUuid: '1' },
    { uuid: '1b', label: 'docker-compose.yml', kind: 'item', ownerUuid: '1' },
    { uuid: '2', label: 'staging-server', kind: 'dir', ownerUuid: null, isOpen: false },
    { uuid: '2a', label: 'error.log', kind: 'item', ownerUuid: '2' },
  ]);

  getId = (node: CustomNode) => node.uuid;
  getParentId = (node: CustomNode) => node.ownerUuid;
  getName = (node: CustomNode) => node.label;
  isFolderNode = (node: CustomNode) => node.kind === 'dir';

  deleteNode(node: CustomNode, event: MouseEvent) {
    event.stopPropagation();
    this.nodes.update((list) => list.filter((n) => n.uuid !== node.uuid && n.ownerUuid !== node.uuid));
  }
}
