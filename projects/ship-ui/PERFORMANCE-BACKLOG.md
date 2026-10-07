# Performance backlog

Measured improvements we have not made yet, ranked within each component. Numbers are medians on Node 26 with
`--expose-gc`, after warmup, unless a row says otherwise. Line references are as of 2026-10-07 and will drift.

Reference for the fixes below: `sh-code` already went through this (value sync coalescing, persistent line tree,
benchmark harness). See `ship-code/ship-code.ts` (`valueSync`, `flushValue`), `ship-code/core/line-tree.ts` and
`ship-code/benchmarks/run.ts`.

## sh-editor

The columnar model, per-block render hints, selection mapping and multi-cursor fan-out are already fine. The cost is
around the model.

| Per keystroke (insert one char, middle paragraph) | 1k blocks | 10k blocks |
|---|---|---|
| Model + history + selection | 37 µs | 71 µs |
| + default HTML value sync | 55 µs | 231 µs |
| + markdown value sync | 105 µs | 619 µs |
| + JSON value sync | 362 µs | 4.7 ms |
| HTML value sync + metrics word count | 187 µs | 1.6 ms |

### 1. Coalesce value sync (high, ½–1 day)

`ship-editor.ts` (effect around line 421) serializes the whole document on every `version` change, compares it with
`value()` and calls `value.set` + `onChange`. HTML and markdown are built from per-block caches but the whole string
is still joined and compared; JSON runs `fromColumnar` and rebuilds the full AST every keystroke.

- Fix: the `sh-code` pattern. A `valueSync` input (`'idle' | 'immediate' | 'blur'`), `flushValue()`, flush on blur
  and destroy, external writes win over an unsent edit. Track the last synced version instead of comparing strings.
- Keep `#render()` out of the serialize effect so rendering stays synchronous.
- Add a spec that counts serializations during typing, like `ship-code.spec.ts`.
- Gain: 0.2 / 0.6 / 4.7 ms per keystroke at 10k blocks (HTML / markdown / JSON). Also fixes the spreadsheet block
  inside the editor from the editor side.

### 2. Undo stack (high, 2–4 hours)

`editor-engine.service.ts:230` does `#undoStack.update((s) => [...s, tx])`: the whole stack is copied on every
keystroke, with no depth limit and no merging of consecutive typing.

- Measured: 22 µs → 135 µs → 808 µs average per insert over 1k / 10k / 50k inserts, growing without bound.
- Fix: push onto a mutable array and expose a length signal for `canUndo`; merge consecutive typing in the same block
  within a short window into one entry; cap the depth (e.g. 1000).
- Bonus: undo steps become words, not characters.

### 3. Incremental word and character counts (medium, 2–4 hours)

The `#counts` computed (`ship-editor.ts` around line 195) walks every character of every row on each change. Only
runs when `showMetrics` is on.

- Measured: about 1.3 ms of the 1.6 ms per keystroke at 10k blocks.
- Fix: keep counts per row, adjust by the edited row's delta, recount fully on structural ops and `reset`. Debounce
  the stats line.

### 4. Benchmark harness (medium, ½ day)

No harness or perf spec exists. Model it on `ship-code/benchmarks/run.ts`: insert, enter, backspace, serialize per
format, undo/redo and multi-cursor at 100 / 1k / 10k blocks, plus a typing case with history growth.

### 5. Small engine costs (low, ~1 hour)

`structuredClone` on mark reads (`editor-engine.service.ts` around lines 317, 332, 648) and `JSON.stringify` mark keys
(around 329, 348). A few µs each.

### 6. Not yet measured: DOM side

The two class-cleanup effects (`ship-editor.ts` around lines 474 and 509) run `querySelectorAll` on every `version`
change, and `patchDOM` compares `outerHTML`. Profile in a real browser before changing anything.

## sh-spreadsheet

The standalone grid is already cheap: formulas recompute only dependents, history stores inverse ops, and rendering
reads only the visible window. The cost is in the block embedded in sh-editor.

| One cell edit | 10k cells | 100k cells | 1M cells |
|---|---|---|---|
| Standalone (model + evaluator + row-measure loop) | 0.010 ms | 0.067 ms | 0.46 ms |
| Editor block (+ JSON round trips) | 0.30 ms | 2.6 ms | 29 ms |

### 1. Block echo detection by identity (high, ½–1 day)

`ship-spreadsheet-block.ts` serializes the whole sheet to JSON several times per edit: line 113 (`onOps`), line 89
(attrs effect, also runs `sheetFromJSON` on its own echo), line 100 (remote path). `SHEET_INNER_ALGEBRA` (around
lines 37–38) parses attrs to a model for both apply and invert.

- Fix: detect the echo by reference (last `cells` array or model written), and cache attrs → model by identity so
  `sheetFromJSON` only runs for attrs the block did not produce.
- Check whether the editor's history snapshots block attrs while doing this.
- Gain: 29 ms → under 1 ms at 1M cells, 2.6 ms → about 0.1 ms at 100k.

### 2. Skip geometry and stylesheet work when tracks are unchanged (medium, 2–4 hours)

The model effect in `ship-spreadsheet.ts` (around lines 668–702) re-measures every row and column, rewrites the
column stylesheet's `textContent` (`#syncColStyles`, around 731–751) and bumps `#geometry` on every edit.

- JS cost is small (0.2 ms at 50k rows), but replacing the stylesheet makes the browser recheck styles for every
  mounted cell. Not measured yet.
- Fix: skip it when `rows`, `cols`, `rowHeights` and `colWidths` are the same references as last time. A
  `set-cells` edit keeps all four.

### 3. Benchmark harness and guard (medium, ½ day)

No harness or perf spec. Add `ship-spreadsheet/benchmarks/run.ts` on the `sh-code` pattern (standalone edit, block
edit, a structural op at 10k / 100k / 1M cells) and a spec that fails if `sheetToJSON` runs on the block's edit path.

### 4. Chunked cell storage (low, 1–2 days)

`sheet-model.ts:201` (`model.cells.slice()` in `applySetCells`) copies the whole cell array per edit: 0.03 ms at 100k
cells, 0.7 ms at 1M, plus GC pressure. Copy-on-write row chunks or a persistent chunked array like the `sh-code` line
tree would fix it, but `transform`, clipboard, the evaluator and `sheetToJSON` read `model.cells` directly. Only worth
it if million-cell sheets are a real target.

### 5. Wide-range recompute loop (low, under 1 hour)

`sheet-formulas.ts` around line 1045: `#recompute` walks all of `#wide` (ranges over `RANGE_DEP_CAP`) on every stack
pop. Push the wide set once. Only matters with many huge-range formulas.

## sh-code (leftovers)

Typing is now about 2.7 µs per keystroke at 50k lines. What remains is O(n) by nature or off the typing path:

- **Whole-text consumers**: copy, cut, the idle value flush, Cmd+D and select-all-occurrences need the full text
  (about 1 ms at 50k lines). `getText` is cached per document, so they share one serialization per version. A
  search over the tree's lines instead of the joined string would take Cmd+D off it.
- **Token cache splice**: `IncrementalTokenizer.spliceLines` (`textmate/incremental.ts`) splices a flat array, O(n)
  but a native memmove. Could share the line tree's chunking if it ever shows up in a profile.
- **Move line**: `line-move.ts` reads every line once per command to remap cursors. Fine for a command, not for a
  hot path.
- **External value writes** rebuild the tree (`createDocument`, about 1 ms at 50k lines). Expected.
- **Real-component typing benchmark**: the harness measures the model path. A TestBed variant driving
  `ShipCode.insertText` with change detection would include Angular's cost per keystroke.

## Styles (leftovers from the structure pass)

- 74 structure-lint warnings remain, all raw `px` or padding literals: mostly `ship-editor`, `ship-video` and
  `ship-spreadsheet`. Run `bun run lint:structure --warnings`.
- Long-form token names deferred from the rename: `--chart-dot-size`, `--chart-fill-opacity`, `--chart-stroke-width`,
  `--vpl-item-hover`, `--ach-size`, `--ach-icon`, `--chat-max-w`, `--ci-size`, `--ff-spinner-size`, `--fu-bg-active`,
  `--ring-size`, `--spinner-size`, `--step-active-c`, `--tabs-c-active`, `--tabs-c-hover`, `--bp-icon-c`, and the `-fg`
  suffix on `--code-fg`, `--shs-fg`, `--shs-head-fg`.
