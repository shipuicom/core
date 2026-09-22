# Cell extensions

How `sh-spreadsheet` grows cell types — checkbox, date, select, record link, rating, currency, formula
— without the model, the ops, the transform, or the inverses learning anything about them. This is the
spreadsheet's counterpart of `ship-editor`'s block behaviors. The first slice (this document, the registry,
the text default and a checkbox) landed with the composer; the rest is the plan.

## 1. The shape

**The model holds strings.** `SheetModel.cells` is a flat `string[]`; nothing in an op is ever anything but a
string. That is what keeps `applySheetOp`, `transformSheetOp`, exact inverses, TSV, JSON and the `<table>`
form stable while types come and go.

**A column has a type.** `SheetModel.colTypes: (string | null)[]` names, per column, the extension that
interprets that column's strings; `null` is text. It is a column property like `colWidths`: it moves with
`insert-cols`/`remove-cols`, rides the `remove-cols` inverse (`insert-cols.types`), and changes through one
op, `set-col-type`, whose transform is the `set-col-width` transform (same track arithmetic, same tie-break).
`SheetJSON.colTypes` persists it (omitted when all text); `<col data-type="checkbox">` carries it in the
document form so an editor block round-trips it. Unknown or malformed types read back as text.

Why per column and not per cell: a checkbox column, a date column, a "linked task" column is how sheets and
database views are actually shaped (Notion, Airtable, Excel's table columns), the type map stays O(cols), and
the structural ops need no new cases. A per-cell override (one odd cell that is a checkbox) can be added later
as a sparse `cellTypes: Record<number, string>` keyed by cell index with an `insert/remove` shift and a
`set-cell-type` op — the extension contract below does not change for it, only the lookup.

**An extension interprets.** `SheetCellExtension` (`core/sheet-extensions.ts`):

| Member | Role | Default |
| --- | --- | --- |
| `type` | the key stored in `colTypes` | — |
| `render(raw, ctx)` | escaped display HTML, written into the row's `innerHTML` payload | (text: escaped raw) |
| `parse(input, ctx)` | typed/pasted text → stored string; `null` rejects | identity |
| `format(raw, ctx)` | what the text editor and a formula bar show | raw |
| `activate(raw, ctx)` | Enter / Space / click → new raw, or `null` | none |
| `editor` | `'text'` (built-in overlay), `'none'` (activation only), or a component | `'text'` |
| `validate(raw, ctx)` | error message for a stored string | none |
| `toText` / `toMarkdown` / `toHtml` | export forms | raw / `toText` / escaped `toText` |

`ctx` is `{ row, col, type }`; an extension never receives the model. The composer builds a
`SheetCellRegistry` from its `extensions` input on top of the built-ins (`text`, `checkbox`); unknown types
fall back to text, so a document typed by an app-side extension still renders where that extension is not
registered.

## 2. What the composer does with it (landed)

- `visibleRows` resolves one extension per mounted column and calls `render` per cell; non-text columns get
  a `t-<type>` class on the cell span for styling.
- Typing, Enter, F2: a `'text'` editor opens with `format(raw)`; on commit the text goes through `parse` —
  `null` announces a rejection and leaves the cell. An `editor: 'none'` type activates on Enter/Space, and a
  typed character is parsed and committed directly (typing `x` in a checkbox column checks it).
- A plain click (no sweep, no modifier, single-cell selection) on a cell whose type has `activate`
  activates it — the checkbox toggle.
- Paste runs every value through its column's `parse`; a rejected value keeps the current text.
- The context menu lists `Column type: <type>` for every registered type; `setColType(col, type)` and
  `setSelectionColType(type)` are the programmatic verbs. They emit `set-col-type` ops like any other change.
- TSV copy stays raw (it is the lossless interchange form); `toText`/`toMarkdown`/`toHtml` are for the
  serialisers (next slice).

## 3. Next slices, in order

1. **Component editors.** `editor: Type<SheetCellEditor>` — the composer mounts the component in the
   overlay's box with `createComponent`, sets `value`, reads `readValue()` on commit, and forwards
   Enter/Tab/Escape the way the textarea does. Date (`sh-datepicker`), select/tags (`sh-select`), rating.
   ~1 day. Until then a `Type` is treated as `'text'`.
2. **Serialisers.** `sheetToTableHtml` uses `toHtml`, a Markdown table export uses `toMarkdown`, the app's
   CSV/search text uses `toText`. Requires passing a registry to the pure functions (optional argument,
   default text). ~half a day.
3. **Validation surface.** `validate` drives a per-cell error class and an announcement; cheap once the
   style-bucket rendering for formats exists (SHEETS.md §3.2).
4. **Per-cell overrides** as described above, only if a real need appears.

## 4. Where extensions live

Upstream (`@ship-ui/core/ship-spreadsheet`): `text`, `checkbox` (now); `number`/`currency`/`percent`
(format only — display formatting belongs with SHEETS.md §3.2 cell formats and shares its number formatter),
`date`, `select`, `rating` (with component editors, slice 1); `formula` is not an extension — see
FORMULAS.md: a formula is any text cell starting with `=`, and the text extension's render consults the
evaluator.

App side (sparkle-todo): anything that knows the app's records — `record` (link to a task/event/page:
stores the record id string, renders the title from the store, editor is the app's picker), `assignee`,
`status` bound to the app's enums, and the database-view write-back (SHEETS.md §3.7) where a column's type
comes from the record field rather than from `colTypes`. They register through the composer's
`extensions` input; the library never imports them.

## 5. Alternatives considered

- *Type in the cell string* (`checkbox:true`): no schema change, but every consumer that reads `cells` must
  parse the prefix, sorting/search break, and paste from outside the sheet would need to know the prefix.
  Rejected.
- *Type as a host callback only* (`cellType(row, col)` input, nothing in the model): right for the database
  view, wrong for a standalone sheet whose types must persist and sync. The callback can still be layered on
  top (the app-side view will do exactly that); the persisted column type is the base.
- *Extensions as Angular components per cell*: one component per visible cell is the thing the string-built
  rows exist to avoid on 10M-cell sheets. Components are for editors (one at a time), strings for display.
