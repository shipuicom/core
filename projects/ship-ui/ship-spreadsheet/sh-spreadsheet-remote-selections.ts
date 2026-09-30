import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ShipSheetCollab } from './sheet-collab';
import { ShipSpreadsheet } from './sh-spreadsheet';

/** How high the name tag is, to decide whether it fits above a range or has to sit inside it. */
const LABEL_PX = 18;

export interface PeerRangePaint {
  clientId: string;
  name: string;
  color: string;
  rects: { top: number; left: number; width: number; height: number; label: boolean; inside: boolean }[];
}

/**
 * Paints the cell selections of remote peers over an `sh-spreadsheet`: one
 * outlined, tinted box per range in the peer's colour, the peer's name on the
 * active (last) range.
 *
 * Project it inside the grid — `<sh-spreadsheet …><sh-spreadsheet-remote-selections
 * [collab]="collab" /></sh-spreadsheet>` — and it picks the grid up from the
 * spreadsheet's injector. (Placing it elsewhere with an explicit `[grid]` input
 * also works, as long as the host sits in the grid body's coordinate space.) It
 * repaints on peer, model and geometry changes; ranges are cell coordinates,
 * resolved to pixel boxes through the grid's own `rangeBox`, so they track
 * resized tracks and structural edits.
 */
@Component({
  selector: 'sh-spreadsheet-remote-selections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (peer of paints(); track peer.clientId) {
      @for (rect of peer.rects; track $index) {
        <div
          class="remote-range"
          [style.--peer-c]="peer.color"
          [style.top.px]="rect.top"
          [style.left.px]="rect.left"
          [style.width.px]="rect.width"
          [style.height.px]="rect.height">
          @if (rect.label) {
            <span class="remote-label" [class.inside]="rect.inside">{{ peer.name }}</span>
          }
        </div>
      }
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      /* Level with the grid's own selection boxes, below the sticky rails and the cell editor. */
      z-index: 1;
    }

    .remote-range {
      position: absolute;
      box-sizing: border-box;
      border: 2px solid var(--peer-c);
      background: color-mix(in srgb, var(--peer-c) 12%, transparent);
      border-radius: 2px;
    }

    .remote-label {
      position: absolute;
      bottom: 100%;
      left: -2px;
      padding: 0 5px;
      border-radius: 4px 4px 4px 0;
      background: var(--peer-c);
      color: #fff;
      font-size: 11px;
      line-height: 1.5;
      white-space: nowrap;

      &.inside {
        bottom: auto;
        top: -2px;
        border-radius: 0 0 4px 0;
      }
    }
  `,
})
export class ShSpreadsheetRemoteSelections {
  // Projected content resolves DI at its declaration site, so when this
  // component sits inside <sh-spreadsheet> the grid is injectable.
  #parentGrid = inject(ShipSpreadsheet, { optional: true });

  /** Grid override for placement outside the spreadsheet; defaults to the enclosing grid. */
  grid = input<ShipSpreadsheet | null>(null);
  /** The collab session whose peers should be painted. */
  collab = input.required<ShipSheetCollab>();

  readonly paints = computed<PeerRangePaint[]>(() => {
    const grid = this.grid() ?? this.#parentGrid;
    if (!grid) return [];
    const paints: PeerRangePaint[] = [];

    for (const peer of this.collab().peers().values()) {
      const ranges = peer.selection?.ranges ?? [];
      if (ranges.length === 0) continue;
      const rects: PeerRangePaint['rects'] = [];
      ranges.forEach((range, i) => {
        const box = grid.rangeBox(range);
        if (box) rects.push({ ...box, label: i === ranges.length - 1, inside: box.top < LABEL_PX });
      });
      if (rects.length) paints.push({ clientId: peer.clientId, name: peer.name, color: peer.color, rects });
    }

    return paints;
  });
}
