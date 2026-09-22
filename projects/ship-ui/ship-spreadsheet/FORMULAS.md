# Formulas — design note

**Status: step 1 of §5 landed** — `core/sheet-formulas.ts`: the grammar (`parseFormula`), `SheetEvaluator`
(`update(model, ops?)`, `valueAt`, `errorAt`, `isFormulaAt`), the dependency graph with incremental recompute on
`set-cells` (a structural op or an update without ops rebuilds), structural cycle detection (`#CYCLE` on the
cycle and downstream), the errors listed in §2, SUM/AVG(AVERAGE)/MIN/MAX/COUNT/COUNTA/ABS/ROUND/IF/CONCAT/LEN/
TODAY, and `rewriteFormulaRefs(source, op)` as a pure function. Not yet done: running the rewrite inside the
structural applies (§3, step 2), and the view boundary (§5 steps 3–4) — the composer does not consult the
evaluator yet. Ranges over 10 000 cells register on the sheet as a whole rather than per cell.

This note fixes the shape so that the model, the ops, the transform and the
composer that exist today do not have to change when formulas arrive. It answers the brief's suggestion
(one Angular `computed` per formula cell) with a different engine and says why.

## 1. What stays exactly as it is

- **A formula is a string in `cells`.** `=SUM(A1:A3)` is the raw text of a text cell; `set-cells` writes
  it, inverses restore it, `transformSheetOp` moves it, TSV copies it. The composer already keeps the raw
  source separate from the displayed value (the text extension's `render` is the only place a display value
  is produced, and the in-cell editor shows `format(raw)` — i.e. the source).
- **No new op kinds for formulas.** Evaluation is derived state, never stored.
- **No signals in the model.** `SheetModel` is an immutable value; reactivity lives at the view boundary
  (the house pattern from `sh-editor` and `sh-code`).

## 2. The engine: a pure incremental evaluator, not a signal per cell

`core/sheet-formulas.ts` exports:

```ts
class SheetEvaluator {
  /** Evaluate `model` incrementally against the last model seen. */
  update(model: SheetModel, ops?: readonly SheetOp[]): void;
  /** Displayed value of a cell — the raw string for non-formula cells. */
  valueAt(row: number, col: number): string;
  /** `#CYCLE`, `#REF!`, `#NAME?`, `#DIV/0!`, `#VALUE!` or null. */
  errorAt(row: number, col: number): string | null;
}
```

Internals:

- **Parse once per formula cell.** A small grammar (numbers, strings, `+ - * / ^ &`, comparisons, `A1`,
  `$A$1`, `A1:B3`, function calls; functions start with SUM/AVERAGE/MIN/MAX/COUNT/IF/ROUND/CONCAT/LEN/TODAY)
  into an AST cached by cell index and source string.
- **Dependency graph** `deps: Map<cellIndex, Set<cellIndex>>` and its reverse `dependents`. Ranges expand
  to their cells; a range over more than, say, 10 000 cells registers on a coarse row-band key instead of
  per cell to keep the graph bounded.
- **Incremental recompute.** `update(model, ops)` maps each op to dirty cells: `set-cells` dirties the
  rectangle; structural ops re-index the graph (the same index shifting as `transformSheetOp`, reused) and
  dirty every formula whose references crossed the splice. Dirty cells and their transitive dependents are
  recomputed in topological order; nothing else is touched. Without `ops` (a loaded document, a remote
  snapshot) everything is recomputed once.
- **Cycle detection** during the topological walk (Tarjan on the dirty subgraph); every cell on a cycle
  gets `#CYCLE`, and a cell that references a `#CYCLE` cell shows `#CYCLE` too, so the origin is visible
  from any endpoint.
- **Values are strings** at the boundary (what `render` needs), numbers inside; number display formatting
  belongs to cell formats (SHEETS.md §3.2), not to the evaluator.

### Why not `computed` per formula cell

The brief's shape — one `computed` per formula cell over the cells it references — is natural in a mutable,
signal-per-cell store. Here it fights the model:

1. The model is an immutable value replaced on every op; per-cell signals would have to be rebuilt or
   mutated behind the value's back after each transaction, which is the two-representations problem the
   ops were introduced to avoid.
2. A 10 M-cell sheet can carry tens of thousands of formulas; a signal graph of that size costs memory
   and, worse, scheduling — every dependent recomputes lazily on read, so a scrolling viewport pays
   evaluation on render instead of once per edit.
3. Structural ops (insert a row inside a range) do not map onto signal dependencies; they need the same
   index arithmetic the transform has, which lives naturally in a graph the evaluator owns.

What signals are right for: the boundary. The composer exposes one `values` signal (`computed` from
`sheet()` through the evaluator, keyed by model identity so a re-read is free) and the text extension's
`render` reads it. That gives the view the same reactive contract it has today with a single signal instead
of one per cell.

## 3. Structural ops must rewrite references

`=A5` must become `=A6` when a row is inserted above 5, on every peer, deterministically. The rewrite is a
pure function `rewriteRefs(source, splice): string` over the formula text (regex-level on the tokens, no
full parse needed) and it runs **inside `applyInsertRows`/`applyRemoveRows`/`applyInsertCols`/
`applyRemoveCols`** for every cell that starts with `=`, so it is part of the op's semantics: both sides of
a concurrent pair apply the same rewrite to the same op, and the TP1 property the fuzz test checks keeps
holding with formulas in the random models (the generator will get a formula cell kind when this lands).
References into a removed band become `#REF!` in the text, which is what spreadsheets do and what the
inverse (`insert-rows` with the removed cells) restores exactly, since the inverse carries the pre-rewrite
strings of the removed rows and the rewrite of the surviving cells is itself reversible by the inverse
splice.

Cost: `apply` for structural ops becomes O(cells) scans of the first character; it already copies the
cells array, so the asymptotics are unchanged.

## 4. Cross-sheet references

`Sheet2!A1` needs a workbook (SHEETS.md §3.5 option b). Not before formulas are in; the evaluator takes an
optional `resolveExternal(sheetName, row, col)` hook so a workbook can supply it later without a redesign.

## 5. Order of work

1. Grammar + evaluator + graph, pure, with tests (`sheet-formulas.spec.ts`): ~3 days.
2. `rewriteRefs` inside the structural applies + formula kind in the transform fuzz: ~1 day.
3. View boundary: `values` signal in the composer, text `render` through it, `#…` error class: ~half a day.
4. Formula bar (`activeLabel` + `format(raw)` already exist on the composer): ~half a day.
