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
  readonly el = inject(ElementRef<HTMLElement>);
}

@Directive({ selector: 'sh-icon[closedIcon]', standalone: true })
export class ShipTreeClosedIcon {
  readonly el = inject(ElementRef<HTMLElement>);
}

@Directive({ selector: 'sh-icon[itemIcon]', standalone: true })
export class ShipTreeItemIcon {
  readonly el = inject(ElementRef<HTMLElement>);
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
  /** The flat list of all tree nodes. */
  readonly items = model<any[]>([]);

  /** Optional Writable/Readable WritableSignal manager created by createTreeSortableManager. */
  readonly sortableManager = input<any>(null);

  /** Currently selected node ID. */
  readonly selectedId = model<string | null>(null);

  // Mappings
  readonly getId = input<(item: any) => string>((item) => item.id);
  readonly getName = input<(item: any) => string>((item) => item.name);
  readonly getParentId = input<(item: any) => string | null>((item) => item.parentId);
  readonly isFolder = input<(item: any) => boolean>((item) => item.type === 'dir');
  readonly getIsOpen = input<(item: any) => boolean>((item) => !!item.isOpen);
  readonly setIsOpen = input<(item: any, isOpen: boolean) => void>((item, open) => {
    item.isOpen = open;
  });

  /** Function returning a custom icon name for a node. */
  readonly getIcon = input<(item: any) => string | null>(() => null);

  // Read projected icons via lightweight directives
  readonly openIconDir = contentChild(ShipTreeOpenIcon);
  readonly closedIconDir = contentChild(ShipTreeClosedIcon);
  readonly itemIconDir = contentChild(ShipTreeItemIcon);

  openIconName = computed(() => this.openIconDir()?.el.nativeElement.textContent?.trim() || null);
  closedIconName = computed(() => this.closedIconDir()?.el.nativeElement.textContent?.trim() || null);
  itemIconName = computed(() => this.itemIconDir()?.el.nativeElement.textContent?.trim() || null);

  // Outputs
  readonly nodeClick = output<any>();
  readonly nodeToggle = output<{ node: any; isOpen: boolean }>();

  readonly nodeTemplate = contentChild<TemplateRef<any>>('nodeTemplate');
  readonly dirTemplate = contentChild<TemplateRef<any>>('dirTemplate');

  /** Filter the full flat array down to only visible nodes (whose parents are all expanded). */
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

  selectNode(node: any) {
    this.selectedId.set(this.getId()(node));
    this.nodeClick.emit(node);
  }

  getDepthArray(depth: number): number[] {
    return Array.from({ length: depth }, (_, i) => i);
  }

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
