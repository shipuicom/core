import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-virtual-scrolls-architecture',
  imports: [Highlight, PropertyViewer],
  templateUrl: './virtual-scrolls-architecture.html',
  styleUrl: './virtual-scrolls-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VirtualScrollsArchitecture {
  codeComponent = `<sh-virtual-scroll>
  @for (item of items(); track item.id) {
    <!-- every projected item must carry the #item template ref -->
    <div #item class="row">{{ item.label }}</div>
  }
</sh-virtual-scroll>`;

  codeDirective = `<!-- the container scrolls; the directive host holds the rows -->
<div class="scroller" style="overflow: auto">
  <div [shVirtualScroll]="items().length" #vs="shVirtualScroll">
    @for (item of items().slice(vs.start(), vs.end()); track item.id) {
      <div class="row">{{ item.label }}</div>
    }
  </div>
</div>`;

  codeDirectiveHorizontal = `<!-- horizontal: the container scrolls on x, items are windowed by width -->
<div class="film-strip" style="overflow: auto">
  <div class="film-row" [shVirtualScroll]="frames().length" virtualAxis="horizontal" [virtualEstimate]="120" #vs="shVirtualScroll">
    @for (frame of frames().slice(vs.start(), vs.end()); track frame.id) {
      <img [src]="frame.thumb" />
    }
  </div>
</div>`;

  codeWindowBasics = `import { ShipVirtualWindow } from '@ship-ui/core/ship-virtual-scroll';

// 50,000 items, assume 36px each until the DOM proves otherwise
const win = new ShipVirtualWindow({ count: 50_000, estimate: 36, overscan: 200 });

// Feed it scroll positions; read the window back as signals.
win.update(scroller.scrollTop, scroller.clientHeight);

win.start();      // first mounted index
win.end();        // exclusive end of the mounted range
win.padStart();   // px of unmounted content before the window (spacer)
win.padEnd();     // px after the window
win.totalSize();  // full scrollable size`;

  codeWindowMeasure = `// Record real sizes as rows get laid out. offsetTop deltas between
// siblings fold inter-item margins (including collapse) into the numbers.
win.measureElements(container.children as any, win.start());

// …or one at a time (a ResizeObserver callback, a known row height):
win.measure(index, 44);

// Structural edits mirror in without losing measurements elsewhere:
// 2 rows at index 10 replaced by 5 new (unmeasured) ones.
win.splice(10, 2, 5);

// Fresh document / re-measured uniform size — rebuild outright:
win.reset(newCount, newEstimate);`;

  codeHeightMap = `// Under the window sits BlockHeightMap: measured sizes where the DOM has
// told us, a rolling-average estimate everywhere else. The estimate locks
// after 32 measurements so the pixel model turns deterministic — a moving
// average re-prices *all* unmeasured items at once, which shifts content
// under a fixed scrollTop and oscillates.
const map = win.heights;

map.indexAt(12_345);    // which item spans pixel offset 12,345 (binary search)
map.prefixHeight(100);  // pixel offset of item 100's top — O(1) after a
                        // lazily rebuilt prefix-sum pass (O(n) over a
                        // Float64Array, ~60µs at 60k items)
map.heightOf(7);        // measured size, or the estimate
map.isMeasured(7);`;

  code2d = `// sh-sheet-view runs one window per axis — the column one horizontal,
// so sizes are widths and update() takes scrollLeft/clientWidth.
#rowWin = new ShipVirtualWindow({ count: 0, estimate: 28, overscan: 200 });
#colWin = new ShipVirtualWindow({ count: 0, estimate: 96, overscan: 200, axis: 'horizontal' });

#updateWindow(scroller: HTMLElement) {
  this.#rowWin.update(scroller.scrollTop, scroller.clientHeight);
  this.#colWin.update(scroller.scrollLeft, scroller.clientWidth);
}
// template mounts rows rowWin.start()..end() × cols colWin.start()..end()`;

  codeEditorUsage = `<!-- sh-editor and sh-code: 'auto' (default) virtualizes past 1,000
     top-level blocks / lines; true/false force it -->
<sh-editor [(value)]="doc" virtualization="auto" />
<sh-code [(value)]="source" [virtualization]="true" />`;
}
