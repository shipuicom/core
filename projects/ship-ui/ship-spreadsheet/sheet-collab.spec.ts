import { Component, Injector, runInInjectionContext, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CollabDocument } from '@ship-ui/core/ship-editor-collab';
import { SheetJSON, SheetModel, SheetOp, SheetSelection, applySheetOps, createSheet, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { SHEET_COLLAB_ALGEBRA, SheetCollabOp, SheetCollabTransport, ShipSheetCollab } from './sheet-collab';
import { ShipSpreadsheet } from './sh-spreadsheet';
import { CollabMessage } from '@ship-ui/core/ship-editor-collab';

type Msg = CollabMessage<SheetCollabOp, SheetJSON, SheetSelection>;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rnd: () => number, n: number) => Math.floor(rnd() * n);

/** In-memory hub: queues per receiver so delivery can be deferred and interleaved. */
class Hub {
  #subscribers: { id: string; cb: (m: Msg) => void; queue: Msg[] }[] = [];

  transport(id: string): SheetCollabTransport {
    const hub = this;
    return {
      send(message) {
        for (const sub of hub.#subscribers) if (sub.id !== id) sub.queue.push(structuredClone(message));
      },
      subscribe(cb) {
        const entry = { id, cb, queue: [] as Msg[] };
        hub.#subscribers.push(entry);
        return () => hub.#subscribers.splice(hub.#subscribers.indexOf(entry), 1);
      },
      connected: signal(true),
    };
  }

  flush() {
    for (let round = 0; round < 50; round++) {
      let delivered = false;
      for (const sub of this.#subscribers) {
        while (sub.queue.length) {
          delivered = true;
          sub.cb(sub.queue.shift()!);
        }
      }
      if (!delivered) return;
    }
  }

  deliverOne(id: string) {
    const sub = this.#subscribers.find((s) => s.id === id);
    const message = sub?.queue.shift();
    if (sub && message) sub.cb(message);
  }
}

/** A headless sheet document: a model signal with transaction bookkeeping, no component. */
class MemorySheet implements CollabDocument<SheetCollabOp, SheetJSON, SheetSelection> {
  readonly model = signal<SheetModel>(createSheet(1, 1));
  readonly version = signal(0);
  readonly selection = signal<SheetSelection | null>(null);
  #last: { baseVersion: number; op: SheetCollabOp } | null = null;

  constructor(model: SheetModel) {
    this.model.set(model);
  }

  apply(ops: SheetCollabOp) {
    this.model.set(applySheetOps(this.model(), ops).model);
    this.#last = { baseVersion: this.version(), op: ops };
    this.version.update((v) => v + 1);
  }

  snapshot = () => sheetToJSON(this.model());
  lastTransaction = () => this.#last;
  applyRemote = (op: SheetCollabOp) => this.model.set(applySheetOps(this.model(), op).model);
  load = (doc: SheetJSON) => this.model.set(sheetFromJSON(doc)!);
}

function makeSite(hub: Hub, clientId: string, model: SheetModel) {
  const injector = Injector.create({ providers: [] });
  const doc = new MemorySheet(model);
  const collab = runInInjectionContext(injector, () => new ShipSheetCollab());
  collab.attachDocument(doc, SHEET_COLLAB_ALGEBRA, { transport: hub.transport(clientId), clientId, presenceThrottleMs: 0 });
  hub.flush();
  const apply = (ops: SheetCollabOp) => {
    doc.apply(ops);
    collab.flushLocal();
  };
  return { doc, collab, apply };
}

const grid = (m: SheetModel) => JSON.stringify({ rows: m.rows, cols: m.cols, cells: m.cells, colWidths: m.colWidths, rowHeights: m.rowHeights, colTypes: m.colTypes });
const base = () => createSheet(3, 3, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3']);

describe('ShipSheetCollab convergence (headless documents)', () => {
  it('replicates sequential transactions both ways', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', base());
    const b = makeSite(hub, 'bbb', base());
    a.apply([{ kind: 'set-cells', row: 0, col: 0, values: [['A']] }]);
    hub.flush();
    b.apply([{ kind: 'insert-rows', at: 0, count: 1 }, { kind: 'set-cells', row: 0, col: 0, values: [['B']] }]);
    hub.flush();
    expect(grid(a.doc.model())).toBe(grid(b.doc.model()));
    expect(a.doc.model().cells.slice(0, 4)).toEqual(['B', '', '', 'A']);
  });

  it('converges when a cell edit and a row insert cross in flight', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', base());
    const b = makeSite(hub, 'bbb', base());
    a.apply([{ kind: 'set-cells', row: 1, col: 1, values: [['A']] }]);
    b.apply([{ kind: 'insert-rows', at: 1, count: 2 }]);
    hub.flush();
    expect(grid(a.doc.model())).toBe(grid(b.doc.model()));
    expect(a.doc.model().rows).toBe(5);
    expect(a.doc.model().cells[3 * 3 + 1]).toBe('A');
  });

  it('a late joiner receives a snapshot and then converges', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', base());
    a.apply([{ kind: 'set-col-type', col: 2, type: 'checkbox' }]);
    hub.flush();
    const c = makeSite(hub, 'ccc', createSheet(1, 1));
    hub.flush();
    expect(grid(c.doc.model())).toBe(grid(a.doc.model()));
    c.apply([{ kind: 'set-cells', row: 2, col: 2, values: [['true']] }]);
    hub.flush();
    expect(grid(c.doc.model())).toBe(grid(a.doc.model()));
  });

  it('converges under randomized concurrent transactions with reordered delivery', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rnd = mulberry32(seed);
      const hub = new Hub();
      const a = makeSite(hub, 'aaa', base());
      const b = makeSite(hub, 'bbb', base());
      const sites = [a, b];
      const ids = ['aaa', 'bbb'];
      let tag = 0;
      for (let step = 0; step < 30; step++) {
        if (rnd() < 0.55) {
          const site = sites[pick(rnd, 2)];
          const m = site.doc.model();
          const roll = pick(rnd, 6);
          let op: SheetOp;
          if (m.rows === 0 || m.cols === 0) op = { kind: 'insert-rows', at: 0, count: 1 };
          else if (roll < 3) {
            // Ops are in range by contract (see sheet-transform.ts): a rectangle past the edge would clamp.
            const col = pick(rnd, m.cols);
            op = { kind: 'set-cells', row: pick(rnd, m.rows), col, values: [col + 1 < m.cols ? [`v${++tag}`, `w${tag}`] : [`v${++tag}`]] };
          }
          else if (roll === 3) op = { kind: 'insert-rows', at: pick(rnd, m.rows + 1), count: 1 };
          else if (roll === 4) op = { kind: 'remove-cols', at: pick(rnd, m.cols), count: 1 };
          else op = { kind: 'insert-cols', at: pick(rnd, m.cols + 1), count: 1 };
          site.apply([op]);
        } else {
          hub.deliverOne(ids[pick(rnd, 2)]);
        }
      }
      hub.flush();
      expect(grid(a.doc.model()), `seed ${seed}`).toBe(grid(b.doc.model()));
    }
  });
});

@Component({
  standalone: true,
  imports: [ShipSpreadsheet],
  providers: [ShipSheetCollab],
  template: `<sh-spreadsheet style="height: 200px" [(sheet)]="sheet" [editable]="true" />`,
})
class Host {
  grid = viewChild.required(ShipSpreadsheet);
  sheet = signal<SheetModel>(base());
}

describe('ShipSheetCollab on the composer', () => {
  async function mount(): Promise<ComponentFixture<Host>> {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('broadcasts composer transactions and applies remote ones without echo, rebasing the local history', async () => {
    const hub = new Hub();
    const fixture = await mount();
    const sheetGrid = fixture.componentInstance.grid();
    const collab = fixture.debugElement.injector.get(ShipSheetCollab);
    collab.attach(sheetGrid, { transport: hub.transport('grid'), clientId: 'grid', presenceThrottleMs: 0 });
    const peer = makeSite(hub, 'peer', base());
    hub.flush();

    sheetGrid.apply([{ kind: 'set-cells', row: 2, col: 2, values: [['G']] }]);
    collab.flushLocal();
    hub.flush();
    expect(peer.doc.model().cells[8]).toBe('G');

    peer.apply([{ kind: 'insert-rows', at: 0, count: 1 }]);
    hub.flush();
    expect(sheetGrid.sheet().rows).toBe(4);
    expect(sheetGrid.sheet().cells[3 * 3 + 2]).toBe('G');
    expect(sheetGrid.canUndo()).toBe(true);
    sheetGrid.undo();
    collab.flushLocal();
    hub.flush();
    expect(sheetGrid.sheet().cells[3 * 3 + 2]).toBe('c3');
    expect(sheetGrid.sheet().rows).toBe(4);
    expect(grid(peer.doc.model())).toBe(grid(sheetGrid.sheet()));
    collab.detach();
  });
});
