import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
  styleUrl: './basic-tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
}
