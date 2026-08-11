import { signal } from '@angular/core';
import { BlockHeightMap } from './height-map';

export type ShipVirtualAxis = 'vertical' | 'horizontal';

export interface ShipVirtualWindowOptions {
  /** Number of items in the full list. */
  count: number;
  /** Pixel size assumed for an item the DOM has never laid out. */
  estimate?: number;
  /** Pixels of content kept mounted beyond each viewport edge. */
  overscan?: number;
  /** Scroll axis: sizes are heights on `'vertical'` (default), widths on `'horizontal'`. */
  axis?: ShipVirtualAxis;
}

/**
 * Headless windowing engine: a `BlockHeightMap` plus the scroll math every
 * virtualized ShipUI surface runs. Holds no DOM and no DI — feed it scroll
 * positions and measurements, read the window back as signals. Axis-agnostic:
 * `'vertical'` windows rows by height, `'horizontal'` windows columns by
 * width; `sh-sheet-view` runs one instance per axis.
 *
 * `ShipVirtualScroll` (component) and `ShipVirtualScrollDirective` are thin
 * DOM adapters over this class; use it directly for custom virtualization
 * (canvas rows, table axes, anything with an ordered pixel layout).
 */
export class ShipVirtualWindow {
  #heights: BlockHeightMap;
  #overscan: number;
  #axis: ShipVirtualAxis;

  #start = signal(0);
  #end = signal(0);
  #padStart = signal(0);
  #padEnd = signal(0);
  #totalSize = signal(0);

  /** First mounted index. */
  readonly start = this.#start.asReadonly();
  /** Exclusive end of the mounted range. */
  readonly end = this.#end.asReadonly();
  /** Pixels of unmounted content before the window (spacer/translate offset). */
  readonly padStart = this.#padStart.asReadonly();
  /** Pixels of unmounted content after the window. */
  readonly padEnd = this.#padEnd.asReadonly();
  /** Full scrollable size of the list along the axis. */
  readonly totalSize = this.#totalSize.asReadonly();

  constructor(options: ShipVirtualWindowOptions) {
    this.#heights = new BlockHeightMap(options.count, options.estimate ?? 36);
    this.#overscan = options.overscan ?? 200;
    this.#axis = options.axis ?? 'vertical';
    this.#refreshGeometry();
  }

  /** The underlying size model, for advanced use (e.g. `indexAt`, `prefixHeight`). */
  get heights(): BlockHeightMap {
    return this.#heights;
  }

  get count(): number {
    return this.#heights.count;
  }

  get overscan(): number {
    return this.#overscan;
  }

  get axis(): ShipVirtualAxis {
    return this.#axis;
  }

  setOverscan(px: number): void {
    this.#overscan = px;
  }

  setAxis(axis: ShipVirtualAxis): void {
    this.#axis = axis;
  }

  /**
   * Resize the list. Measurements are kept only when the count is unchanged;
   * a different count rebuilds the map carrying the learned estimate over
   * (or `estimate`, when given).
   */
  setCount(count: number, estimate?: number): void {
    if (count === this.#heights.count) return;
    this.#heights = new BlockHeightMap(count, estimate ?? this.#heights.estimate);
    this.#refreshGeometry();
  }

  /**
   * Rebuild the map unconditionally — unlike `setCount`, this also discards
   * measurements when the count is unchanged (e.g. a fresh document, or a
   * re-measured uniform item size).
   */
  reset(count: number, estimate?: number): void {
    this.#heights = new BlockHeightMap(count, estimate ?? this.#heights.estimate);
    this.#refreshGeometry();
  }

  /** Mirror a structural edit: `remove` items at `at` replaced by `insert` unmeasured ones. */
  splice(at: number, remove: number, insert: number): void {
    this.#heights.splice(at, remove, insert);
    this.#refreshGeometry();
  }

  /** Record one real pixel size. Returns whether the model changed. */
  measure(index: number, size: number): boolean {
    const changed = this.#heights.measure(index, size);
    if (changed) this.#refreshGeometry();
    return changed;
  }

  /**
   * Re-derive the geometry signals from the height map. Call after writing
   * to `heights` directly — e.g. a bulk `heights.measure()` loop, which must
   * NOT go through `measure()` per item: each `measure()` call rebuilds the
   * O(n) prefix sums, turning a bulk pass quadratic.
   */
  sync(): void {
    this.#refreshGeometry();
  }

  /**
   * Measure a run of mounted elements starting at list index `start`.
   * Uses offset deltas between siblings so inter-item margins (including
   * collapse) land inside the numbers; the last element falls back to its
   * own box size. Returns whether any size changed.
   */
  measureElements(elements: ArrayLike<HTMLElement>, start: number): boolean {
    const horizontal = this.#axis === 'horizontal';
    let changed = false;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const next = elements[i + 1];
      const size = horizontal
        ? next
          ? next.offsetLeft - el.offsetLeft
          : el.offsetWidth
        : next
          ? next.offsetTop - el.offsetTop
          : el.offsetHeight;
      changed = this.#heights.measure(start + i, size) || changed;
    }
    if (changed) this.#refreshGeometry();
    return changed;
  }

  /**
   * Recompute the window for a scroll position (`scrollTop`/`scrollLeft`
   * depending on axis). Returns whether the mounted range moved.
   */
  update(scrollOffset: number, viewportSize: number): boolean {
    const from = this.#heights.indexAt(scrollOffset - this.#overscan);
    const to = Math.min(this.count, this.#heights.indexAt(scrollOffset + viewportSize + this.#overscan) + 1);
    return this.setRange(from, to);
  }

  /**
   * Set the mounted range directly — the escape hatch for fallback windows
   * (e.g. a scroller that has not been laid out yet). Returns whether the
   * range moved.
   */
  setRange(start: number, end: number): boolean {
    const moved = start !== this.#start() || end !== this.#end();
    this.#start.set(start);
    this.#end.set(end);
    this.#refreshGeometry();
    return moved;
  }

  #refreshGeometry(): void {
    const total = this.#heights.total();
    const end = Math.min(this.#end(), this.count);
    this.#totalSize.set(total);
    this.#padStart.set(this.#heights.prefixHeight(this.#start()));
    this.#padEnd.set(Math.max(0, total - this.#heights.prefixHeight(end)));
  }
}
