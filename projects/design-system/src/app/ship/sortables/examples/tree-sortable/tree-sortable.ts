import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipSortable, createTreeSortableManager } from '@ship-ui/core/ship-sortable';

interface TreeNode {
  id: string;
  name: string;
  type: 'item' | 'dir';
  parentId: string | null;
  isOpen?: boolean;
}

@Component({
  selector: 'app-tree-sortable',
  standalone: true,
  imports: [ShipSortable, ShipIcon],
  templateUrl: './tree-sortable.html',
  styleUrl: './tree-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeSortable {
  nodes = signal<TreeNode[]>([
    { id: '1', name: 'projects', type: 'dir', parentId: null, isOpen: true },
    { id: '1a', name: 'ship-ui', type: 'dir', parentId: '1', isOpen: true },
    { id: '1a1', name: 'src', type: 'dir', parentId: '1a', isOpen: true },
    { id: '1a1a', name: 'public-api.ts', type: 'item', parentId: '1a1' },
    { id: '1a2', name: 'package.json', type: 'item', parentId: '1a' },
    { id: '1a3', name: 'tsconfig.lib.json', type: 'item', parentId: '1a' },
    { id: '2', name: 'design-system', type: 'dir', parentId: null, isOpen: false },
    { id: '2a', name: 'angular.json', type: 'item', parentId: '2' },
    { id: '3', name: 'README.md', type: 'item', parentId: null },
    { id: '4', name: 'bun.lock', type: 'item', parentId: null },
  ]);

  manager = createTreeSortableManager(this.nodes);

  toggleFolder(node: TreeNode, event: MouseEvent) {
    event.stopPropagation();
    this.nodes.update((list) =>
      list.map((n) => (n.id === node.id ? { ...n, isOpen: !n.isOpen } : n))
    );
  }

  getDepthArray(depth: number): number[] {
    return Array.from({ length: depth }, (_, i) => i);
  }

  getNodeDepth(node: TreeNode): number {
    const list = this.nodes();
    let depth = 0;
    let currentParentId = node.parentId;
    while (currentParentId !== null && currentParentId !== undefined) {
      const parent = list.find((n) => n.id === currentParentId);
      if (!parent) break;
      depth++;
      currentParentId = parent.parentId;
    }
    return depth;
  }
}
