import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Layout strategy for a `sh-window-manager`. */
export type ShipWindowMode = 'tabs' | 'grid' | 'grid-move' | 'dock';

type Axis = 'row' | 'col';
type DropZone = 'center' | 'left' | 'right' | 'top' | 'bottom';

interface StackNode {
  kind: 'stack';
  id: string;
  /** Window ids stacked as tabs in this region. */
  items: string[];
  /** The id of the visible window. */
  active: string;
}
interface SplitNode {
  kind: Axis;
  id: string;
  children: LayoutNode[];
  /** Fractional size of each child (sums to 1). */
  sizes: number[];
}
type LayoutNode = StackNode | SplitNode;

let uid = 0;
const nid = () => `wm-${++uid}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const stackOf = (items: string[]): StackNode => ({ kind: 'stack', id: nid(), items, active: items[0] ?? '' });

// --- pure tree helpers ----------------------------------------------------

/** Build a balanced grid of single-window stacks. */
function buildGrid(ids: string[]): LayoutNode {
  if (ids.length <= 1) return stackOf(ids);
  const cols = Math.ceil(Math.sqrt(ids.length));
  const rows: LayoutNode[] = [];
  for (let r = 0; r < ids.length; r += cols) {
    const cells = ids.slice(r, r + cols).map((id) => stackOf([id]));
    rows.push(cells.length === 1 ? cells[0] : { kind: 'row', id: nid(), children: cells, sizes: even(cells.length) });
  }
  return rows.length === 1 ? rows[0] : { kind: 'col', id: nid(), children: rows, sizes: even(rows.length) };
}
const even = (n: number) => Array.from({ length: n }, () => 1 / n);

function buildLayout(mode: ShipWindowMode, ids: string[]): LayoutNode {
  if (mode === 'tabs') return stackOf(ids);
  return buildGrid(ids);
}

/** Replace the node with matching id, returning a new tree. */
function patch(node: LayoutNode, id: string, fn: (n: LayoutNode) => LayoutNode): LayoutNode {
  if (node.id === id) return fn(node);
  if (node.kind === 'stack') return node;
  return { ...node, children: node.children.map((c) => patch(c, id, fn)) };
}

/** Collapse single-child splits and merge same-axis nesting; drop empty stacks. */
function simplify(node: LayoutNode): LayoutNode | null {
  if (node.kind === 'stack') return node.items.length ? node : null;
  const kids: LayoutNode[] = [];
  const sizes: number[] = [];
  node.children.forEach((child, i) => {
    const s = simplify(child);
    if (!s) return;
    if (s.kind === node.kind) {
      // flatten nested same-axis split
      const share = node.sizes[i];
      s.children.forEach((gc, gi) => {
        kids.push(gc);
        sizes.push(share * s.sizes[gi]);
      });
    } else {
      kids.push(s);
      sizes.push(node.sizes[i]);
    }
  });
  if (kids.length === 0) return null;
  if (kids.length === 1) return kids[0];
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  return { ...node, children: kids, sizes: sizes.map((s) => s / total) };
}

function removeWindow(root: LayoutNode, windowId: string): LayoutNode {
  const strip = (node: LayoutNode): LayoutNode => {
    if (node.kind === 'stack') {
      if (!node.items.includes(windowId)) return node;
      const items = node.items.filter((w) => w !== windowId);
      const active = node.active === windowId ? (items[0] ?? '') : node.active;
      return { ...node, items, active };
    }
    return { ...node, children: node.children.map(strip) };
  };
  return simplify(strip(root)) ?? stackOf([]);
}

// --- window declaration ---------------------------------------------------

/**
 * Declares a window inside a `sh-window-manager`. Use on an `<ng-template>`; the
 * manager arranges the declared windows according to its `mode` and renders each
 * window's content where it belongs.
 */
@Directive({
  selector: 'ng-template[shWindow]',
  standalone: true,
})
export class ShipWindow {
  templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  /** Stable identifier for this window. */
  windowId = input.required<string>();
  /** Label shown in the window's tab. */
  windowTitle = input<string>('');
  /** Optional Phosphor icon name shown before the title. */
  windowIcon = input<string>('');
}

// --- recursive renderer ---------------------------------------------------

@Component({
  selector: 'sh-window-node',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ShipWindowNode, ShipIcon],
  template: `
    @let n = node();
    @if (n.kind === 'stack') {
      <div class="sh-window-stack" [attr.data-node]="n.id">
        <div class="sh-window-tabs" role="tablist">
          @for (id of n.items; track id) {
            @let win = manager.window(id);
            <button
              class="sh-window-tab"
              role="tab"
              type="button"
              [class.active]="id === n.active"
              [class.dragging]="manager.dragging() === id"
              (pointerdown)="onTabDown($event, n, id)"
              (click)="manager.activate(n.id, id)">
              @if (win?.windowIcon()) {
                <sh-icon>{{ win!.windowIcon() }}</sh-icon>
              }
              <span class="sh-window-tab-label">{{ win?.windowTitle() || id }}</span>
              @if (manager.closable()) {
                <sh-icon
                  class="sh-window-tab-close"
                  (pointerdown)="$event.stopPropagation()"
                  (click)="close($event, id)">
                  x
                </sh-icon>
              }
            </button>
          }
        </div>

        <div class="sh-window-body">
          @let active = manager.window(n.active);
          @if (active) {
            <ng-container [ngTemplateOutlet]="active.templateRef" />
          }
        </div>

        @if (manager.dropTarget()?.stackId === n.id) {
          <div class="sh-window-drop" [attr.data-zone]="manager.dropTarget()!.zone"></div>
        }
      </div>
    } @else {
      <div class="sh-window-split" [class.col]="n.kind === 'col'" [attr.data-node]="n.id">
        @for (child of n.children; track child.id; let i = $index) {
          <div class="sh-window-pane" [style.flexGrow]="n.sizes[i]" [style.flexBasis.px]="0">
            <sh-window-node [node]="child" />
          </div>
          @if (!$last && manager.gutters()) {
            <div class="sh-window-gutter" (pointerdown)="manager.startGutter($event, n, i)"></div>
          }
        }
      </div>
    }
  `,
  host: { class: 'sh-window-node' },
})
export class ShipWindowNode {
  node = input.required<LayoutNode>();
  manager = inject(ShipWindowManager);

  onTabDown(event: PointerEvent, stack: StackNode, id: string) {
    if (!this.manager.movable()) return;
    this.manager.startDrag(event, stack, id);
  }

  close(event: Event, id: string) {
    event.stopPropagation();
    this.manager.closeWindow(id);
  }
}

// --- manager --------------------------------------------------------------

/**
 * A multi-mode window manager. Wrap `<ng-template shWindow>` windows and pick a
 * `mode`: browser-style `tabs`, a locked tiling `grid`, a rearrangeable
 * `grid-move`, or a full `dock` (drag tabs between regions and drop on an edge to
 * split). Regions resize by dragging the gutters between them.
 */
@Component({
  selector: 'sh-window-manager',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShipWindowNode],
  host: { class: 'sh-window-manager', '[attr.data-mode]': 'mode()' },
  template: `
    @if (layout(); as root) {
      <sh-window-node [node]="root" />
    }
    <ng-content />
  `,
  styleUrl: './ship-window-manager.scss',
})
export class ShipWindowManager {
  #el = inject(ElementRef<HTMLElement>);
  #doc = inject(DOCUMENT);

  /** Layout strategy. */
  mode = input<ShipWindowMode>('grid');
  /** Show a close control on each tab. */
  closable = input(true);
  /** Minimum fractional size a region can be shrunk to when resizing. */
  minFraction = input(0.08);

  protected windowRefs = contentChildren(ShipWindow);
  #byId = computed(() => new Map(this.windowRefs().map((w) => [w.windowId(), w])));
  window(id: string): ShipWindow | undefined {
    return this.#byId().get(id);
  }

  #layout = signal<LayoutNode | null>(null);
  layout = this.#layout.asReadonly();

  /** Whether the current mode allows resizing region gutters. */
  gutters = computed(() => this.mode() !== 'tabs');
  /** Whether the current mode allows dragging tabs to move/rearrange them. */
  movable = computed(() => this.mode() === 'grid-move' || this.mode() === 'dock');

  readonly dragging = signal<string | null>(null);
  readonly dropTarget = signal<{ stackId: string; zone: DropZone } | null>(null);

  #lastKey = '';

  constructor() {
    effect(() => {
      const ids = this.windowRefs().map((w) => w.windowId());
      const key = this.mode() + '|' + ids.join(',');
      if (key === this.#lastKey) return;
      this.#lastKey = key;
      this.#layout.set(buildLayout(this.mode(), ids));
    });
  }

  activate(stackId: string, windowId: string) {
    this.#update((root) => patch(root, stackId, (n) => (n.kind === 'stack' ? { ...n, active: windowId } : n)));
  }

  closeWindow(windowId: string) {
    this.#update((root) => removeWindow(root, windowId));
  }

  #update(fn: (root: LayoutNode) => LayoutNode) {
    const root = this.#layout();
    if (root) this.#layout.set(fn(root));
  }

  // --- gutter resize ------------------------------------------------------

  startGutter(event: PointerEvent, split: SplitNode, index: number) {
    event.preventDefault();
    const horizontal = split.kind === 'row';
    const start = horizontal ? event.clientX : event.clientY;
    const containerPx = this.#paneContainerPx(split, horizontal);
    const a = split.sizes[index];
    const b = split.sizes[index + 1];
    const sum = a + b;
    const min = this.minFraction();

    this.#session((ev) => {
      const delta = (horizontal ? ev.clientX : ev.clientY) - start;
      const df = containerPx ? delta / containerPx : 0;
      const na = clamp(a + df, min, sum - min);
      this.#update((root) =>
        patch(root, split.id, (n) => {
          if (n.kind === 'stack') return n;
          const sizes = [...n.sizes];
          sizes[index] = na;
          sizes[index + 1] = sum - na;
          return { ...n, sizes };
        })
      );
    });
  }

  #paneContainerPx(split: SplitNode, horizontal: boolean): number {
    const el = this.#el.nativeElement.querySelector(`[data-node="${split.id}"]`) as HTMLElement | null;
    const host = el ?? this.#el.nativeElement;
    return horizontal ? host.clientWidth : host.clientHeight;
  }

  // --- tab drag / dock ----------------------------------------------------

  startDrag(event: PointerEvent, from: StackNode, windowId: string) {
    event.preventDefault();
    this.dragging.set(windowId);
    this.#session(
      (ev) => this.#trackDrop(ev),
      () => {
        const target = this.dropTarget();
        this.dragging.set(null);
        this.dropTarget.set(null);
        if (target) this.#drop(windowId, from.id, target.stackId, target.zone);
      }
    );
  }

  #trackDrop(ev: PointerEvent) {
    const el = this.#doc.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
    const stackEl = el?.closest('.sh-window-stack') as HTMLElement | null;
    const stackId = stackEl?.getAttribute('data-node');
    if (!stackEl || !stackId) {
      this.dropTarget.set(null);
      return;
    }
    const r = stackEl.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;
    let zone: DropZone = 'center';
    if (this.mode() === 'dock') {
      const edge = 0.25;
      if (px < edge && px <= py && px <= 1 - py) zone = 'left';
      else if (1 - px < edge && 1 - px <= py && 1 - px <= 1 - py) zone = 'right';
      else if (py < edge) zone = 'top';
      else if (1 - py < edge) zone = 'bottom';
    }
    this.dropTarget.set({ stackId, zone });
  }

  #drop(windowId: string, fromStackId: string, toStackId: string, zone: DropZone) {
    if (fromStackId === toStackId && zone === 'center') return;

    // grid-move: swap the two single windows' home stacks instead of merging.
    if (this.mode() === 'grid-move') {
      this.#swap(fromStackId, toStackId);
      return;
    }

    this.#update((root) => {
      let next = removeWindow(root, windowId);
      next = patch(next, toStackId, (n) => {
        if (n.kind !== 'stack') return n;
        if (zone === 'center') return { ...n, items: [...n.items, windowId], active: windowId };
        const fresh = stackOf([windowId]);
        const before = zone === 'left' || zone === 'top';
        const axis: Axis = zone === 'left' || zone === 'right' ? 'row' : 'col';
        const children = before ? [fresh, n] : [n, fresh];
        return { kind: axis, id: nid(), children, sizes: even(2) };
      });
      return simplify(next) ?? next;
    });
  }

  #swap(aId: string, bId: string) {
    if (aId === bId) return;
    this.#update((root) => {
      let a: StackNode | null = null;
      let b: StackNode | null = null;
      const find = (n: LayoutNode) => {
        if (n.kind === 'stack') {
          if (n.id === aId) a = n;
          if (n.id === bId) b = n;
        } else n.children.forEach(find);
      };
      find(root);
      if (!a || !b) return root;
      const sa = a as StackNode;
      const sb = b as StackNode;
      let next = patch(root, aId, () => ({ ...sb, id: aId }));
      next = patch(next, bId, () => ({ ...sa, id: bId }));
      return next;
    });
  }

  // --- shared pointer session --------------------------------------------

  #session(onMove: (event: PointerEvent) => void, onEnd?: () => void) {
    const ac = new AbortController();
    const opts = { signal: ac.signal };
    const end = () => {
      ac.abort();
      this.#doc.body.style.userSelect = '';
      onEnd?.();
    };
    this.#doc.addEventListener('pointermove', onMove, opts);
    this.#doc.addEventListener('pointerup', end, opts);
    this.#doc.addEventListener('pointercancel', end, opts);
    this.#doc.body.style.userSelect = 'none';
  }
}
