import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipSortable } from '@ship-ui/core/ship-sortable';

@Directive({ selector: 'sh-icon[openIcon]', standalone: true })
export class ShipTreeOpenIcon {
  el = inject(ElementRef<HTMLElement>);
}

@Directive({ selector: 'sh-icon[closedIcon]', standalone: true })
export class ShipTreeClosedIcon {
  el = inject(ElementRef<HTMLElement>);
}

@Directive({ selector: 'sh-icon[itemIcon]', standalone: true })
export class ShipTreeItemIcon {
  el = inject(ElementRef<HTMLElement>);
}

@Component({
  selector: 'sh-tree',
  standalone: true,
  imports: [NgTemplateOutlet, ShipIcon, ShipSortable],
  templateUrl: './ship-tree.html',
  styleUrl: './ship-tree.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sh-tree]': 'true',
  },
})
export class ShipTree {
  
  /** Two-way bound flat list of tree nodes; updated in place when folders are toggled. */
  items = model<any[]>([]);

  /** Optional external sortable manager used for drag-and-drop reordering and computing visible nodes. */
  sortableManager = input<any>(null);

  /** Two-way bound id of the currently selected node. */
  selectedId = model<string | null>(null);

  /** Accessor returning the unique id of a node. */
  getId = input<(item: any) => string>((item) => item.id);
  /** Accessor returning the display name of a node. */
  getName = input<(item: any) => string>((item) => item.name);
  /** Accessor returning the parent id of a node, or `null` for root nodes. */
  getParentId = input<(item: any) => string | null>((item) => item.parentId);
  /** Predicate deciding whether a node is a folder (expandable). */
  isFolder = input<(item: any) => boolean>((item) => item.type === 'dir');
  /** Accessor returning whether a folder node is currently expanded. */
  getIsOpen = input<(item: any) => boolean>((item) => !!item.isOpen);
  /** Setter that updates a node's expanded state. */
  setIsOpen = input<(item: any, isOpen: boolean) => void>((item, open) => {
    item.isOpen = open;
  });

  /** Accessor returning a custom icon name for a node, overriding the default folder/file icons. */
  getIcon = input<(item: any) => string | null>(() => null);

  
  openIconDir = contentChild(ShipTreeOpenIcon);
  closedIconDir = contentChild(ShipTreeClosedIcon);
  itemIconDir = contentChild(ShipTreeItemIcon);

  openIconName = computed(() => this.openIconDir()?.el.nativeElement.textContent?.trim() || null);
  closedIconName = computed(() => this.closedIconDir()?.el.nativeElement.textContent?.trim() || null);
  itemIconName = computed(() => this.itemIconDir()?.el.nativeElement.textContent?.trim() || null);

  
  /** Emits the node when it is selected (clicked). */
  nodeClick = output<any>();
  /** Emits the node and its new expanded state when a folder is toggled. */
  nodeToggle = output<{ node: any; isOpen: boolean }>();

  nodeTemplate = contentChild<TemplateRef<any>>('nodeTemplate');
  dirTemplate = contentChild<TemplateRef<any>>('dirTemplate');

  
  visibleNodes = computed(() => {
    const manager = this.sortableManager();
    if (manager && typeof manager.visibleNodes === 'function') {
      return manager.visibleNodes();
    }

    const list = this.items();
    const visible: any[] = [];

    const isNodeVisible = (node: any): boolean => {
      let currentParentId = this.getParentId()(node);
      while (currentParentId !== null && currentParentId !== undefined) {
        const parent = list.find((n) => this.getId()(n) === currentParentId);
        if (!parent || !this.getIsOpen()(parent)) {
          return false;
        }
        currentParentId = this.getParentId()(parent);
      }
      return true;
    };

    for (const node of list) {
      const parentId = this.getParentId()(node);
      if (parentId === null || parentId === undefined || isNodeVisible(node)) {
        visible.push(node);
      }
    }
    return visible;
  });

  toggleNode(node: any, event: MouseEvent) {
    event.stopPropagation();
    const open = !this.getIsOpen()(node);

    this.items.update((list) =>
      list.map((item) => {
        if (this.getId()(item) === this.getId()(node)) {
          const updated = { ...item };
          this.setIsOpen()(updated, open);
          return updated;
        }
        return item;
      })
    );

    this.nodeToggle.emit({ node, isOpen: open });
  }

  handleNodeClick(node: any, event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isIconClick = !!target.closest('sh-icon') && !target.closest('.sh-tree-node-actions') && !target.closest('sh-tree-node-actions') && !target.closest('.caret-container');

    if (isIconClick && this.isFolder()(node)) {
      this.toggleNode(node, event);
    } else {
      this.selectNode(node);
    }
  }

  /** Marks the given node as selected and emits `nodeClick`. */
  selectNode(node: any) {
    this.selectedId.set(this.getId()(node));
    this.nodeClick.emit(node);
  }

  /** Returns an index array of the given length, used to render one indent guide per depth level. */
  getDepthArray(depth: number): number[] {
    return Array.from({ length: depth }, (_, i) => i);
  }

  /** Computes a node's nesting depth by walking its chain of parents. */
  getNodeDepth(node: any): number {
    const list = this.items();
    let depth = 0;
    let currentParentId = this.getParentId()(node);
    while (currentParentId !== null && currentParentId !== undefined) {
      const parent = list.find((n) => this.getId()(n) === currentParentId);
      if (!parent) break;
      depth++;
      currentParentId = this.getParentId()(parent);
    }
    return depth;
  }

  /** Resolves the icon name for a node: a custom icon if provided, otherwise the open/closed folder or item icon. */
  getNodeIcon(node: any): string | null {
    const customIcon = this.getIcon()(node);
    if (customIcon) return customIcon;

    if (this.isFolder()(node)) {
      const open = this.getIsOpen()(node);
      return open ? this.openIconName() : this.closedIconName();
    }
    return this.itemIconName() || 'file';
  }
}

@Component({
  selector: 'sh-tree-node',
  template: `
    <div class="sh-tree-node-left">
      <ng-content select="sh-icon" />
      <span class="sh-tree-node-label">
        <ng-content />
      </span>
    </div>
    <div class="sh-tree-node-actions">
      <ng-content select="[actions], sh-tree-node-actions" />
    </div>
  `,
  host: {
    '[class.sh-tree-node-layout]': 'true',
  },
})
export class ShipTreeNode {}

@Component({
  selector: 'sh-tree-node-actions',
  template: `
    <ng-content />
  `,
  host: {
    '[class.sh-tree-node-actions]': 'true',
  },
})
export class ShipTreeNodeActions {}
