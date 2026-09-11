import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTree, ShipTreeClosedIcon, ShipTreeOpenIcon } from '@ship-ui/core/ship-tree';

interface FsNode {
  id: string;
  name: string;
  type: 'dir' | 'item';
  parentId: string | null;
  isOpen?: boolean;
  size?: number;
  modified?: string;
}

const ICON_BY_EXTENSION: Record<string, string> = {
  ts: 'file-ts',
  js: 'file-js',
  html: 'file-html',
  scss: 'file-css',
  css: 'file-css',
  json: 'brackets-curly',
  md: 'file-md',
  svg: 'file-svg',
  png: 'image',
  jpg: 'image',
};

@Component({
  selector: 'app-file-explorer-example',
  standalone: true,
  imports: [FormsModule, ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipIcon, ShipButton, ShipFormField],
  templateUrl: './file-explorer.html',
  styleUrl: './file-explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerExample {
  nodes = signal<FsNode[]>([
    { id: 'src', name: 'src', type: 'dir', parentId: null, isOpen: true },
    { id: 'app', name: 'app', type: 'dir', parentId: 'src', isOpen: true },
    { id: 'app-ts', name: 'app.ts', type: 'item', parentId: 'app', size: 1840, modified: '2026-09-01' },
    { id: 'app-html', name: 'app.html', type: 'item', parentId: 'app', size: 920, modified: '2026-09-01' },
    { id: 'app-scss', name: 'app.scss', type: 'item', parentId: 'app', size: 610, modified: '2026-08-28' },
    { id: 'routes', name: 'app.routes.ts', type: 'item', parentId: 'app', size: 430, modified: '2026-08-20' },
    { id: 'assets', name: 'assets', type: 'dir', parentId: 'src', isOpen: false },
    { id: 'logo', name: 'logo.svg', type: 'item', parentId: 'assets', size: 3120, modified: '2026-07-14' },
    { id: 'hero', name: 'hero.png', type: 'item', parentId: 'assets', size: 248000, modified: '2026-07-14' },
    { id: 'main', name: 'main.ts', type: 'item', parentId: 'src', size: 210, modified: '2026-06-02' },
    { id: 'index', name: 'index.html', type: 'item', parentId: 'src', size: 540, modified: '2026-06-02' },
    { id: 'docs', name: 'docs', type: 'dir', parentId: null, isOpen: false },
    { id: 'readme', name: 'README.md', type: 'item', parentId: 'docs', size: 4200, modified: '2026-08-30' },
    { id: 'changelog', name: 'CHANGELOG.md', type: 'item', parentId: 'docs', size: 12800, modified: '2026-09-03' },
    { id: 'pkg', name: 'package.json', type: 'item', parentId: null, size: 1650, modified: '2026-08-30' },
    { id: 'tsconfig', name: 'tsconfig.json', type: 'item', parentId: null, size: 380, modified: '2026-05-11' },
  ]);

  selectedId = signal<string | null>('app-ts');
  search = signal('');
  renameValue = signal('app.ts');

  /** Nodes shown in the tree: everything, or the search matches plus their ancestors forced open. */
  visibleNodes = computed(() => {
    const query = this.search().trim().toLowerCase();
    const all = this.nodes();
    if (!query) return all;

    const keep = new Set<string>();
    for (const node of all) {
      if (!node.name.toLowerCase().includes(query)) continue;
      let current: FsNode | undefined = node;
      while (current) {
        keep.add(current.id);
        current = all.find((n) => n.id === current!.parentId);
      }
    }
    return all.filter((n) => keep.has(n.id)).map((n) => (n.type === 'dir' ? { ...n, isOpen: true } : n));
  });

  selected = computed(() => this.nodes().find((n) => n.id === this.selectedId()) ?? null);

  /** Breadcrumb from the root down to the selected node. */
  selectedPath = computed(() => {
    const trail: FsNode[] = [];
    let current = this.selected();
    while (current) {
      trail.unshift(current);
      current = this.nodes().find((n) => n.id === current!.parentId) ?? null;
    }
    return trail;
  });

  selectedChildCount = computed(() => {
    const id = this.selectedId();
    return this.nodes().filter((n) => n.parentId === id).length;
  });

  getIcon = (node: FsNode) => {
    if (node.type === 'dir') return null;
    const ext = node.name.split('.').pop()?.toLowerCase() ?? '';
    return ICON_BY_EXTENSION[ext] ?? 'file';
  };

  /** Folder toggles arrive through itemsChange; copy the open state back onto the source list. */
  onItemsChange(list: FsNode[]) {
    if (!this.search().trim()) {
      this.nodes.set(list);
      return;
    }
    this.nodes.update((all) =>
      all.map((n) => {
        const updated = list.find((x) => x.id === n.id);
        return updated && updated.isOpen !== n.isOpen ? { ...n, isOpen: updated.isOpen } : n;
      })
    );
  }

  onSelect(node: FsNode) {
    this.renameValue.set(node.name);
  }

  /** Target folder for new entries: the selected folder, or the folder containing the selected file. */
  #targetFolderId(): string | null {
    const selected = this.selected();
    if (!selected) return null;
    return selected.type === 'dir' ? selected.id : selected.parentId;
  }

  create(type: 'dir' | 'item') {
    const parentId = this.#targetFolderId();
    const siblings = this.nodes().filter((n) => n.parentId === parentId && n.type === type);
    const base = type === 'dir' ? 'new-folder' : 'untitled.ts';
    let name = base;
    for (let i = 2; siblings.some((n) => n.name === name); i++) {
      name = type === 'dir' ? `${base}-${i}` : `untitled-${i}.ts`;
    }

    const node: FsNode = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      parentId,
      isOpen: type === 'dir' ? false : undefined,
      size: type === 'item' ? 0 : undefined,
      modified: new Date().toISOString().slice(0, 10),
    };

    // The tree renders in list order, so a child must sit inside its parent's
    // block: insert it right after the parent's last descendant.
    this.nodes.update((all) => {
      const opened = all.map((n) => (n.id === parentId ? { ...n, isOpen: true } : n));
      const insertAt = parentId === null ? opened.length : this.#subtreeEnd(opened, parentId);
      return [...opened.slice(0, insertAt), node, ...opened.slice(insertAt)];
    });
    this.search.set('');
    this.selectedId.set(node.id);
    this.renameValue.set(node.name);
  }

  /** Index just past the last node inside `folderId`'s subtree. */
  #subtreeEnd(list: FsNode[], folderId: string): number {
    const inside = new Set([folderId]);
    let end = list.findIndex((n) => n.id === folderId) + 1;
    for (let i = end; i < list.length; i++) {
      if (list[i].parentId && inside.has(list[i].parentId!)) {
        inside.add(list[i].id);
        end = i + 1;
      }
    }
    return end;
  }

  rename() {
    const id = this.selectedId();
    const name = this.renameValue().trim();
    if (!id || !name) return;
    this.nodes.update((all) => all.map((n) => (n.id === id ? { ...n, name } : n)));
  }

  deleteSelected() {
    const id = this.selectedId();
    if (!id) return;
    const doomed = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of this.nodes()) {
        if (n.parentId && doomed.has(n.parentId) && !doomed.has(n.id)) {
          doomed.add(n.id);
          grew = true;
        }
      }
    }
    this.nodes.update((all) => all.filter((n) => !doomed.has(n.id)));
    this.selectedId.set(null);
  }

  setAllOpen(open: boolean) {
    this.nodes.update((all) => all.map((n) => (n.type === 'dir' ? { ...n, isOpen: open } : n)));
  }

  formatSize(bytes: number | undefined): string {
    if (bytes == null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
