import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipTree, ShipTreeNode, ShipTreeOpenIcon, ShipTreeClosedIcon } from '@ship-ui/core/ship-tree';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { createTreeSortableManager } from '@ship-ui/core/ship-sortable';

interface TreeNode {
  id: string;
  name: string;
  type: 'item' | 'dir';
  parentId: string | null;
  isOpen?: boolean;
}

@Component({
  selector: 'app-sortable-tree-example',
  standalone: true,
  imports: [ShipTree, ShipTreeNode, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipIcon],
  templateUrl: './sortable-tree.html',
  styleUrl: './sortable-tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortableTreeExample {
  nodes = signal<TreeNode[]>([
    { id: '1', name: 'src', type: 'dir', parentId: null, isOpen: true },
    { id: '1a', name: 'app', type: 'dir', parentId: '1', isOpen: true },
    { id: '1a1', name: 'components', type: 'dir', parentId: '1a', isOpen: true },
    { id: '1a1a', name: 'sidebar.component.ts', type: 'item', parentId: '1a1' },
    { id: '1a1b', name: 'header.component.ts', type: 'item', parentId: '1a1' },
    { id: '1a1c', name: 'footer.component.ts', type: 'item', parentId: '1a1' },
    { id: '1a2', name: 'services', type: 'dir', parentId: '1a', isOpen: false },
    { id: '1a2a', name: 'auth.service.ts', type: 'item', parentId: '1a2' },
    { id: '1a2b', name: 'api.service.ts', type: 'item', parentId: '1a2' },
    { id: '1a3', name: 'app.component.ts', type: 'item', parentId: '1a' },
    { id: '1a4', name: 'app.routes.ts', type: 'item', parentId: '1a' },
    { id: '1b', name: 'assets', type: 'dir', parentId: '1', isOpen: false },
    { id: '1b1', name: 'images', type: 'dir', parentId: '1b', isOpen: false },
    { id: '1b1a', name: 'logo.svg', type: 'item', parentId: '1b1' },
    { id: '1b2', name: 'styles.scss', type: 'item', parentId: '1b' },
    { id: '1c', name: 'environments', type: 'dir', parentId: '1', isOpen: false },
    { id: '1c1', name: 'environment.ts', type: 'item', parentId: '1c' },
    { id: '1c2', name: 'environment.prod.ts', type: 'item', parentId: '1c' },
    { id: '1d', name: 'main.ts', type: 'item', parentId: '1' },
    { id: '1e', name: 'index.html', type: 'item', parentId: '1' },
    { id: '2', name: 'package.json', type: 'item', parentId: null },
    { id: '3', name: 'tsconfig.json', type: 'item', parentId: null },
    { id: '4', name: 'angular.json', type: 'item', parentId: null },
    { id: '5', name: 'README.md', type: 'item', parentId: null },
  ]);

  manager = createTreeSortableManager(this.nodes);

  nodesJson = computed(() => JSON.stringify(this.nodes(), null, 2));
}
