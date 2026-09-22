# Formulas — design note

**Status: §5 steps 1–4 landed.** `core/sheet-formulas.ts`: the grammar (`parseFormula`), `SheetEvaluator`
(`update(model, ops?)`, `valueAt`, `errorAt`, `isFormulaAt`), the dependency graph with incremental recompute on
`set-cells` (a structural op or an update without ops rebuilds), structural cycle detection (`#CYCLE` on the
cycle and downstream), the errors listed in §2, SUM/AVG(AVERAGE)/MIN/MAX/COUNT/COUNTA/ABS/ROUND/IF/CONCAT/LEN/
TODAY, and `rewriteFormulaRefs(source, op)`. The rewrite runs inside the structural applies and inside
`transformSheetOp` (§3); the composer exposes `values` (a `SheetValues` per model), shows a formula's value or
error token in the grid and its source in the editor, and has an opt-in `[formulaBar]` (§5 steps 3–4).
Functions live in a `SheetFunctionRegistry`; a host registers its own through `[functions]` and hands them
data through `[functionContext]` (§6).
Ranges over 10 000 cells register on the sheet as a whole rather than per cell. Not done: cross-sheet references
(§4). Two rules differ from Excel so that the rewrite converges under concurrent edits — see §3.

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
pure function `rewriteFormulaRefs(source, op): string` over the formula text (regex-level on the tokens, no
full parse needed) and it runs **inside `applyInsertRows`/`applyRemoveRows`/`applyInsertCols`/
`applyRemoveCols`** for every surviving cell that starts with `=` (never the inserted/restored cells, whose
text is already in the post-insert frame), so it is part of the op's semantics: both sides of a concurrent pair
apply the same rewrite to the same op. `transformSheetOp` rewrites the strings an op *carries* the same way —
`set-cells.values` against the concurrent splice, an insert's restore `cells` against the splice as it lands
after that insert — so a formula written concurrently with a structural edit ends up with the same references
in either order. The fuzz in `sheet-transform.spec.ts` runs with formula cells in the models, in `set-cells`
and in restore data, and checks TP1, sequence convergence and the rebase ladder.

**Exact inverses.** A removal turns references into the band into `#REF!`, and the inverse `insert-rows` /
`insert-cols` cannot know what they were, so `applyRemove*` appends a `set-cells` per damaged survivor (its
pre-removal source, addressed in the restored frame) to the inverse: undo restores the text exactly, and the
inverse of that inverse (redo) reproduces the removal's result. The check is generic — a cell is restored when
rewriting its post-removal text by the inverse insert does not give the original back.

**Two departures from Excel, for convergence.** A range is the tracks between its two end tracks, and the
transform preserves track identity, so:

- a removal strictly inside a range shrinks it, but one that takes either end track is `#REF!` (Excel would
  shrink to the survivors). After a shrink to the band's start, a concurrent insert at that index could not
  tell "the first track" from "just before the first track", and the two orders diverge — the fuzz found it.
- an insert at a range's first track moves the range (as in Excel), strictly inside grows it, just past the
  last track leaves it.

Cost: `apply` for structural ops becomes O(cells) scans of the first character; it already copies the
cells array, so the asymptotics are unchanged.

## 4. Cross-sheet references

`Sheet2!A1` needs a workbook (SHEETS.md §3.5 option b). Not before formulas are in; the evaluator takes an
optional `resolveExternal(sheetName, row, col)` hook so a workbook can supply it later without a redesign.

## 5. Order of work

1. Grammar + evaluator + graph, pure, with tests (`sheet-formulas.spec.ts`). Done.
2. `rewriteFormulaRefs` inside the structural applies and the transform + formula cells in the fuzz. Done.
3. View boundary: `values` signal in the composer (`SheetValues`, one per model, incremental on the
   composer's own ops, rebuilt for an adopted model), the grid renders a formula's value through the column
   type — so `=SUM(A1:A3)` in a currency column reads `$30.00` — or the error token with the source as its
   title (`.shs-error`); the editor opens on the source, in the text editor whatever the column's `inputType`;
   `parse` is bypassed for a formula on commit and paste. `sheetRangeToTsv(model, range, registry, values)`
   exports formula values. Done.
4. Formula bar: `[formulaBar]` on `<sh-spreadsheet>` — address, `fx`, an input bound to `activeSource()`
   (the formula's source, else the type's `format`); Enter commits through the same path as the editor,
   Escape reverts, blur with a change commits; read-only without `editable`. Done.
5. Custom functions: `SheetFunctionRegistry`, `[functions]`, `[functionContext]`, `recalc()`, the formula
   bar's autocomplete. Done — §6.

## 6. Custom functions

Functions are data, not a switch in the evaluator. `SheetFunction` is `{ name, minArgs?, maxArgs?, variadic?,
call(args, ctx), volatile?, signature?, description? }`; `SheetFunctionRegistry` holds them by upper-case name,
mirroring `SheetCellRegistry`: `new SheetFunctionRegistry(functions)` merges over `SHEET_BUILTIN_FUNCTIONS`
(a same-named function overrides the built-in), `registry.with(more)` layers another set, `get`/`has`/`names`/
`list`. `SheetEvaluator` takes a registry (`SHEET_DEFAULT_FUNCTIONS` when none) and an `external` bag.

```ts
const DOUBLE: SheetFunction = { name: 'DOUBLE', minArgs: 1, maxArgs: 1, signature: 'DOUBLE(x)', call: ([x]) => (typeof x === 'number' ? x * 2 : { error: '#VALUE!' }) };
const USERNAME: SheetFunction = { name: 'USERNAME', maxArgs: 0, volatile: true, call: (_, ctx) => (ctx.external as { user: string }).user };
```

```html
<sh-spreadsheet [functions]="[DOUBLE, USERNAME]" [functionContext]="context()" [formulaBar]="true" />
```

- **Calls.** Names are case-insensitive; ranges arrive flattened into `args` (as for SUM). `ctx` is
  `{ row, col, address, model, valueAt(ref), external }` — `valueAt` takes A1 text or `{ row, col }` and
  returns the evaluated value. Cells read through `valueAt` are *not* dependencies (the graph comes from the
  references in the source); a function whose result depends on them or on `external` is `volatile`.
- **Volatile.** A formula calling a volatile function is recomputed on every `update` (any edit) and on
  `recalc()`. `TODAY` is volatile.
- **Context.** `[functionContext]` is any value; it reaches every call as `ctx.external`. A *new* value
  recomputes every formula (the natural shape is a `computed` over the app's signals). Data that changed
  behind the same object needs `grid.recalc()` (the evaluator's `recalc()` underneath).
- **Errors.** A function may return a `FormulaError`, or throw: a thrown error reads `#ERROR!` and its message
  is kept — `values.errorMessageAt(row, col)`, the error cell's `title` (source, newline, message). The wrong
  number of arguments (`minArgs`/`maxArgs`, unless `variadic`) is the same `#ERROR!` with a message. Unknown
  names stay `#NAME?`.
- **Grammar.** A reference-shaped word followed by `(` — `LOG10(`, `AB1(` — is a call, in the parser and in
  `rewriteFormulaRefs`, so custom names never collide with references and the rewrite is unaffected by them.
- **Formula bar.** While the bar holds a formula, the word at the caret lists the registered functions that
  start with it (`signature`, `description`); arrows move, Tab/Enter/click complete to `NAME(`, Escape closes.

