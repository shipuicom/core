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
  signal,
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
  #selfEl = inject(ElementRef<HTMLElement>);

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

  /** Id of the node that last held keyboard focus (the roving tabindex target). */
  activeId = signal<string | null>(null);

  /** Id of the node currently picked up for keyboard reordering (Space toggles). */
  grabbedId = signal<string | null>(null);

  /** Item order at grab time, so Escape can put everything back. */
  #grabSnapshot: any[] | null = null;

  /** Message for the visually-hidden live region announcing grab/move/drop. */
  liveMessage = signal('');

  /**
   * The single node that participates in the tab order. Falls back from the
   * last-focused node to the selection to the first visible node, so tabbing
   * into the tree always lands somewhere sensible.
   */
  tabStopId = computed(() => {
    const visible = this.visibleNodes();
    if (!visible.length) return null;

    const isVisible = (id: string | null) => id !== null && visible.some((n: any) => this.getId()(n) === id);

    const active = this.activeId();
    if (isVisible(active)) return active;

    const selected = this.selectedId();
    if (isVisible(selected)) return selected;

    return this.getId()(visible[0]);
  });

  /** 1-based position of a node among its siblings, for `aria-posinset`. */
  getAriaPosInSet(node: any): number {
    return this.#getSiblings(node).findIndex((n) => this.getId()(n) === this.getId()(node)) + 1;
  }

  /** Number of siblings sharing the node's parent, for `aria-setsize`. */
  getAriaSetSize(node: any): number {
    return this.#getSiblings(node).length;
  }

  #getSiblings(node: any): any[] {
    const parentId = this.getParentId()(node);
    return this.items().filter((n) => (this.getParentId()(n) ?? null) === (parentId ?? null));
  }

  /**
   * Keeps the roving tabindex in sync with wherever focus actually lands —
   * clicks, Tab, or programmatic focus — so keyboard commands always act on
   * the item the user sees focused.
   */
  onTreeFocusIn(event: FocusEvent) {
    const item = (event.target as HTMLElement | null)?.closest?.('[role="treeitem"]');
    const id = item?.getAttribute('data-tree-id');
    if (id != null) this.activeId.set(id);
  }

  onTreeKeydown(event: KeyboardEvent) {
    const visible = this.visibleNodes();
    if (!visible.length) return;

    const currentId = this.tabStopId();
    const currentIndex = visible.findIndex((n: any) => this.getId()(n) === currentId);
    const current = visible[currentIndex];
    if (!current) return;

    const moveTo = (node: any) => {
      event.preventDefault();
      this.#focusNode(this.getId()(node));
    };

    const grabbed = this.grabbedId() !== null && this.grabbedId() === currentId;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (grabbed) this.#moveGrabbed(current, 1);
        else if (currentIndex < visible.length - 1) moveTo(visible[currentIndex + 1]);
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (grabbed) this.#moveGrabbed(current, -1);
        else if (currentIndex > 0) moveTo(visible[currentIndex - 1]);
        break;

      case 'ArrowRight': {
        event.preventDefault();
        if (grabbed) break;
        if (!this.isFolder()(current)) break;
        if (!this.getIsOpen()(current)) {
          this.toggleNode(current, event);
        } else {
          // Open folder: move to its first child, which sits right below it in
          // the visible list when it has one.
          const next = visible[currentIndex + 1];
          if (next && this.getParentId()(next) === this.getId()(current)) moveTo(next);
        }
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        if (grabbed) break;
        if (this.isFolder()(current) && this.getIsOpen()(current)) {
          this.toggleNode(current, event);
          break;
        }
        const parentId = this.getParentId()(current);
        if (parentId !== null && parentId !== undefined) {
          const parent = visible.find((n: any) => this.getId()(n) === parentId);
          if (parent) moveTo(parent);
        }
        break;
      }

      case 'Home':
        moveTo(visible[0]);
        break;

      case 'End':
        moveTo(visible[visible.length - 1]);
        break;

      case 'Enter':
        event.preventDefault();
        this.selectNode(current);
        if (this.isFolder()(current)) this.toggleNode(current, event);
        break;

      case ' ':
        event.preventDefault();
        // With a sortable manager Space picks the item up / drops it again;
        // in a plain tree it acts like Enter and selects.
        if (this.sortableManager()) {
          if (grabbed) {
            this.grabbedId.set(null);
            this.#grabSnapshot = null;
            this.liveMessage.set(`${this.getName()(current)} dropped.`);
          } else {
            this.grabbedId.set(currentId as string);
            this.#grabSnapshot = [...this.items()];
            this.liveMessage.set(
              `${this.getName()(current)} grabbed. Use arrow keys to move, Space to drop, Escape to cancel.`
            );
          }
        } else {
          this.selectNode(current);
        }
        break;

      case 'Escape':
        if (grabbed) {
          event.preventDefault();
          // Cancelling a keyboard drag puts the item back where it started.
          if (this.#grabSnapshot) {
            this.items.set(this.#grabSnapshot);
            this.#grabSnapshot = null;
          }
          this.grabbedId.set(null);
          this.liveMessage.set(`${this.getName()(current)} move cancelled, returned to original position.`);
          setTimeout(() => this.#focusNode(currentId as string));
        }
        break;

      default: {
        // First-character typeahead: jump to the next visible node whose name
        // starts with the typed character, wrapping past the end.
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
        const char = event.key.toLowerCase();
        if (char === ' ') return;

        for (let offset = 1; offset <= visible.length; offset++) {
          const candidate = visible[(currentIndex + offset) % visible.length];
          if (this.getName()(candidate)?.toLowerCase().startsWith(char)) {
            moveTo(candidate);
            break;
          }
        }
      }
    }
  }

  /** Moves the roving tabindex to the node and focuses its element. */
  #focusNode(id: string) {
    this.activeId.set(id);
    const host = this.#selfEl.nativeElement as HTMLElement;
    const el = host.querySelector<HTMLElement>(`[role="treeitem"][data-tree-id="${CSS.escape(id)}"]`);
    el?.focus();
  }

  /** True when `node` sits somewhere below `ancestorId` in the tree. */
  #isDescendantOf(node: any, ancestorId: string): boolean {
    const list = this.items();
    let parentId = this.getParentId()(node);
    while (parentId !== null && parentId !== undefined) {
      if (parentId === ancestorId) return true;
      const parent = list.find((n: any) => this.getId()(n) === parentId);
      if (!parent) return false;
      parentId = this.getParentId()(parent);
    }
    return false;
  }

  /**
   * Moves the grabbed node one visible step up or down through the sortable
   * manager, stepping into open folders the way a pointer drag would.
   */
  #moveGrabbed(current: any, direction: 1 | -1) {
    const manager = this.sortableManager();
    if (!manager || typeof manager.drop !== 'function') return;

    const visible = this.visibleNodes();
    const id = this.getId()(current);
    const currentIndex = visible.findIndex((n: any) => this.getId()(n) === id);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    let position: 'before' | 'after' | 'inside';

    if (direction === 1) {
      // Skip our own subtree: an open folder is followed by its children.
      for (let i = currentIndex + 1; i < visible.length; i++) {
        if (!this.#isDescendantOf(visible[i], id)) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) return;
      const target = visible[targetIndex];
      position = this.isFolder()(target) && this.getIsOpen()(target) ? 'inside' : 'after';
    } else {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) return;
      position = 'before';
    }

    manager.drop({ previousIndex: currentIndex, currentIndex: targetIndex, position }, visible);
    this.liveMessage.set(
      `${this.getName()(current)} moved ${position} ${this.getName()(visible[targetIndex])}.`
    );

    // The reorder re-renders the list, which can drop DOM focus; put it back
    // on the grabbed node once the new order is in the DOM.
    setTimeout(() => this.#focusNode(id));
  }

  toggleNode(node: any, event: Event) {
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
    this.activeId.set(this.getId()(node));
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
    // A custom node template owns its row's icons, so the built-in fallback
    // would double up next to whatever the template renders.
    return this.itemIconName() || (this.nodeTemplate() ? null : 'file');
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
