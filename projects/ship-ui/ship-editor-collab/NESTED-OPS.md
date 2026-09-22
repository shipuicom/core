# Nested ops — co-editing a sheet inside a page

Design for SHEETS.md §4 item 7: a `SheetOp[]` transaction travelling *inside* an editor op so that two people
editing the same embedded sheet converge cell by cell instead of one of them losing a whole block splice.

**Status: implemented** as designed below, with these deltas:

- The algebra registry is module-level (`registerBlockInnerAlgebra` / `blockInnerAlgebra` in
  `editor-transactions.ts`) so the pure `transformOp`/`applyOp`/`invertOp` can reach it; the engine registers
  every `BaseComponentBlockBehavior.innerAlgebra` it is given (`ShipSpreadsheetBlockBehavior` carries
  `SHEET_INNER_ALGEBRA`).
- `BlockInnerOp.inverse` carries the inner inverse computed at apply time (`EditorEngineService.applyBlockInner`),
  so `invertOp` stays pure; inner-vs-inner transform rewrites both `inner` and `inverse`.
- `ShipEditorBlockContext.applyInner?` and `innerOps?` are optional: a block falls back to `updateAttrs` on an
  editor without them. `EditorEngineService.lastInnerOp` feeds `innerOps`; the sheet block applies a peer's
  inner op with `grid.applyRemote` (history kept) when it explains the new attrs, else adopts them wholesale.
- Tests: `ship-editor/editor-block-inner.spec.ts` (toy algebra, engine undo/redo/remote),
  `ship-spreadsheet/sheet-inner-ops.spec.ts` (transform properties, fuzz, two-peer convergence),
  `spreadsheet-block.spec.ts` (block ↔ context).

## 1. Where we are

- `ShipCollabSession<Op, Doc, Sel>` (`collab-session.ts`) is op-agnostic: sequence numbers, `seen`
  marks, the sent-op ladder, join/snapshot, presence. `ShipEditorCollab` binds it to `EditorOp` +
  `transformOp`; `ShipSheetCollab` (`ship-spreadsheet/sheet-collab.ts`) binds it to `SheetOp[]` +
  `transformSheetOps`. Wire format, transports and the relay's per-record op log are shared.
- `transformSheetOp`/`transformSheetOps` (`ship-spreadsheet/core/sheet-transform.ts`) are TP1-convergent
  over every `SheetOp` kind (fuzzed).
- `ShipSpreadsheetBlock` edits through the composer and writes every transaction back with
  `ctx.updateAttrs(...)`, which the engine turns into a **block splice** (`replaceBlocksOp`: remove the
  block, insert it with new attrs). Two concurrent cell edits in the same block are therefore two block
  splices at one index; `transformOp` returns `null` for the loser (`shiftIndex` block-vs-block overlap) and
  one user's edit is dropped. That is the gap.

## 2. The op

```ts
export interface BlockInnerOp {
  kind: 'block-inner';
  blockIndex: number;
  /** The block type whose algebra interprets `inner` (`'sheet'`). */
  type: string;
  inner: unknown;              // for 'sheet': SheetOp[]
}
export type EditorOp = BlockSplice | InlineSplice | BlockInnerOp;
```

`inner` stays opaque to `editor-transactions.ts`; a registry keyed by block `type` supplies the algebra:

```ts
export interface BlockInnerAlgebra<Inner = unknown> {
  transform(op: Inner, against: Inner, side: 'left' | 'right'): Inner | null;
  invert(op: Inner, attrsBefore: Record<string, unknown>): Inner;
  /** attrs after applying `op` to attrs — the engine keeps attrs as the persisted state. */
  apply(attrs: Record<string, unknown>, op: Inner): Record<string, unknown>;
}
```

The sheet registers `{ transform: transformSheetOps(...).ops, apply: attrs ↦ sheetToJSON(applySheetOps(sheetFromJSON(attrs), ops).model), invert: the inverse from applySheetOps }`.
Registration lives on the block behavior (`BaseComponentBlockBehavior.innerAlgebra?`), so the engine finds
it through the behaviors it already has; `ShipSpreadsheetBlockBehavior` provides the sheet one.

## 3. Transform rules (`transformOp`)

| op \ against | BlockSplice | InlineSplice | BlockInnerOp |
| --- | --- | --- | --- |
| **BlockInnerOp** | shift `blockIndex` exactly like `InlineSplice.blockIndex` (before the splice: keep; after: `+delta`; inside the removed range: `null` — the block is gone or replaced wholesale) | unchanged (different concerns) | same `blockIndex` → `inner' = algebra.transform(inner, against.inner, side)` (`null` → `null`); different index → unchanged |
| **BlockSplice** | as today | as today | if `against.blockIndex` is inside `op.removed`: patch the stale removed block's attrs with `algebra.apply` — the same trick `transformOp` already does for a stale inline content (so a later invert re-inserts the block as the peer last saw it); else unchanged |
| **InlineSplice** | as today | as today | unchanged |

TP1 for the inner-vs-inner cell follows from the sheet transform's TP1; the index cases mirror the inline
ones the editor fuzz already covers. The rebase fuzz (`editor-rebase-fuzz.spec.ts`) gets a `block-inner`
mutation on a sheet block and a random `SheetOp` generator (the one in `sheet-transform.spec.ts`).

## 4. Applying and inverting

- `applyOp(doc, op)`: `doc[blockIndex].attrs = algebra.apply(attrs, inner)`; `applyOpToColumnar` /
  `remoteStepMap` (`editor-columnar-ops.ts`): attrs live in the columnar row, so it is a one-row attrs
  write with an identity step map (no flat positions move — a void block has size 1 and keeps it).
- `invertOp`: `{ ...op, inner: algebra.invert(inner, attrsBefore) }` — the inverse needs the pre-state, so
  the engine records it on the transaction (`EditorTransaction.op` already carries `removed` for splices;
  for inner ops the block's attrs before apply are captured at `#apply` time and the inverse computed
  eagerly, stored on the transaction as `inverse`, and `invertOp` returns it). For the sheet this is the
  exact inverse `applySheetOps` returns, so undo restores cells, sizes and types precisely.
- History rebasing (`applyRemoteOperation`'s undo-stack ladder) uses `transformOp` and works unchanged
  once the table above is in.

## 5. Producing the op

`ShipEditorBlockContext` gains `applyInner(op: unknown): void` next to `updateAttrs`. `ShipSpreadsheetBlock.onOps`
calls `ctx.applyInner(ops)` instead of `updateAttrs(attrsPatch(model))`; the engine wraps it as
`{ kind: 'block-inner', blockIndex, type: 'sheet', inner: ops }`, applies it through the algebra, records
the transaction. `updateAttrs` stays for blocks without an algebra (a splice, as today). The block's
adoption path (attrs signal → model) is unchanged: after a remote inner op the wrapper's `data-sh-attrs`
changes and the composer adopts — but with `applyRemote` semantics available, the block can do better:
`ctx` can expose the last remote inner op so the composer calls `grid.applyRemote(inner)` and keeps its
in-cell history instead of clearing it. That is a refinement, not a requirement for convergence.

## 6. Serialisation and the relay

Unchanged. Attrs remain the persisted `SheetJSON`; the document form is still the `<table>`. On the wire a
`block-inner` op is a small JSON object (one cell edit is ~80 bytes instead of two copies of the sheet),
which also fixes the `page_op` bloat noted in SHEETS.md §3.6. The relay stores ops opaquely.

## 7. Size and order

1. `BlockInnerOp` + registry + `transformOp` table + `applyOp`/`invertOp` + fuzz: ~1.5 days
   (`editor-transactions.ts`, `editor-rebase-fuzz.spec.ts`).
2. Engine: `applyInner` on the block context, columnar apply, transaction inverse capture: ~1 day
   (`editor-engine.service.ts`, `editor-columnar-ops.ts`, `ship-editor.ts`, `sh-editor-component-block.ts`).
3. `ShipSpreadsheetBlock.onOps` → `applyInner`; behavior provides the algebra; block spec: ~half a day.

All of 1–2 is editor code, which is why it is a note and not a commit from the spreadsheet side.
