import { Injectable, OutputRefSubscription, Signal, signal } from '@angular/core';
import { CollabAlgebra, CollabDocument, CollabTransport, ShipCollabSession } from '@ship-ui/core/ship-editor-collab';
import { SheetJSON, SheetOp, SheetSelection, sheetFromJSON, sheetToJSON } from './core/sheet-model';
import { transformSheetOps } from './core/sheet-transform';
import { ShipSpreadsheet } from './ship-spreadsheet';

/** A sheet's unit of collaboration: one composer transaction. */
export type SheetCollabOp = SheetOp[];
export type SheetCollabTransport = CollabTransport<SheetCollabOp, SheetJSON, SheetSelection>;

/**
 * The sheet algebra for the collab session: transactions transform as
 * sequences through `transformSheetOps`, never `null` — a transaction
 * with nothing left to do is the empty one, which applies as a no-op.
 */
export const SHEET_COLLAB_ALGEBRA: CollabAlgebra<SheetCollabOp> = {
  transform: (op, against, side) => transformSheetOps(op, against, side).ops,
};

export interface ShipSheetCollabOptions {
  transport: SheetCollabTransport;
  clientId?: string;
  presence?: { name: string; color: string };
  presenceThrottleMs?: number;
}

/**
 * An `sh-spreadsheet` composer seen as a collab document: every `ops`
 * emission is one transaction and bumps the version; remote transactions go
 * through `applyRemote` (history rebased, nothing echoed); a snapshot is the
 * `SheetJSON`; loading one replaces the model (the composer adopts it and
 * clears its history, as for any outside model).
 */
export class SheetCollabDocument implements CollabDocument<SheetCollabOp, SheetJSON, SheetSelection> {
  readonly version = signal(0);
  readonly selection: Signal<SheetSelection | null>;
  #last: { baseVersion: number; op: SheetCollabOp } | null = null;
  #subscription: OutputRefSubscription;

  constructor(readonly grid: ShipSpreadsheet) {
    this.selection = grid.selection;
    this.#subscription = grid.ops.subscribe((ops) => this.recordLocal(ops));
  }

  /** Note a local transaction (the composer's `ops` output feeds this). */
  recordLocal(ops: SheetCollabOp): void {
    this.#last = { baseVersion: this.version(), op: ops.slice() };
    this.version.update((v) => v + 1);
  }

  snapshot(): SheetJSON {
    return sheetToJSON(this.grid.sheet());
  }

  lastTransaction(): { baseVersion: number; op: SheetCollabOp } | null {
    return this.#last;
  }

  applyRemote(op: SheetCollabOp): void {
    this.grid.applyRemote(op);
  }

  load(doc: SheetJSON): void {
    const model = sheetFromJSON(doc);
    if (model) this.grid.sheet.set(model);
  }

  destroy(): void {
    this.#subscription.unsubscribe();
  }
}

/**
 * Collaboration for a standalone `sh-spreadsheet`: the same session,
 * protocol and transports as `ShipEditorCollab`, with `SheetOp[]`
 * transactions as the op and `transformSheetOps` as the algebra.
 *
 * ```ts
 * collab = inject(ShipSheetCollab);            // provided on the page component
 * afterNextRender(() => this.collab.attach(this.grid(), { transport }));
 * ```
 */
@Injectable()
export class ShipSheetCollab extends ShipCollabSession<SheetCollabOp, SheetJSON, SheetSelection> {
  #document: SheetCollabDocument | null = null;

  attach(grid: ShipSpreadsheet, options: ShipSheetCollabOptions): void {
    const document = new SheetCollabDocument(grid);
    // attachDocument detaches first, which destroys the previous document.
    this.attachDocument(document, SHEET_COLLAB_ALGEBRA, options);
    this.#document = document;
  }

  override detach(): void {
    super.detach();
    this.#document?.destroy();
    this.#document = null;
  }
}
