# Editor handover: virtualization done — the editor is vim-scale

Branch: `editor-columnar-model` (main repo, no worktree). All work committed,
tree clean, 692 unit tests + 25 Playwright e2e green at time of writing.

## Architecture as it stands

- **The columnar document is the only live model** (`editor-columnar.ts`,
  `ColumnarDocument`): one row per block/item, typed-array columns, Fenwick
  size index. `engine.document()` is a computed that materializes the nested
  AST via `fromColumnar` **on demand**, cached per `version` — nothing on the
  typing path reads it.
- **Selections are flat character positions** `{ from, to }` in the token
  space `logicalToPos`/`StepMap` define (text block = 2 + length tokens,
  void = 1). Collapsed ⇔ `from === to`.
- **Every mutation primitive lives in `editor-columnar-mutations.ts`**:
  mutates rows in place, returns `{ op: EditorOp, selAfter }`. The op feeds
  undo/redo/collab (`transformOp` unchanged) and is derived by diffing only
  the touched span of top-level blocks with `diffDocuments`. Primitives with
  a possible identity outcome (insertText, insertFragment,
  replaceBlockWithFragment) return `{ op: null, selAfter }` so the selection
  still collapses after the content. `sliceDocument`/`fragmentPlainText`
  materialize the fragment a flat selection covers (boundary blocks trimmed)
  — clipboard serialization when the DOM can't provide it.
- **Rendering**: engine keeps a per-block HTML cache + `RenderHint` queue
  (`block` = re-render one element, `splice` = DOM splice with untouched
  suffix, `all` = full pass). `serialize('html'|'markdown')` assembles from
  per-block caches; `serialize('json')` = `fromColumnar`. The component's
  `patchDOM` replays hints; inline edits patch **text data in place** and the
  caret restore skips `addRange` when the DOM selection already matches.
- **Viewport virtualization** (`editor-viewport.ts` + the virtual block in
  `ship-editor.ts`): past 1000 top-level blocks (`virtualization` input:
  `'auto' | boolean`) the surface mounts only `[#winStart, #winEnd)` —
  viewport ± 600px overscan — with inline padding standing in for the rest.
  - `BlockHeightMap`: measured pixel heights (offsetTop deltas → margins and
    collapse included) + a rolling-average estimate that **locks after 32
    measurements**; scroll↔block mapping via a lazily rebuilt prefix array.
  - `patchDOM` dispatches: below threshold the old path runs byte-identical
    (`#winStart` pinned 0). Virtualized, `block` hints patch in place (typing
    path untouched); structural hints splice the height map and rebuild the
    window from the HTML cache. Scrolling splices only window edges, so
    surviving elements (and the caret) are never replaced.
  - All DOM↔block translation goes through `#winStart` (mapDOMToPoint incl.
    container-anchored offsets, caret restore, reconciliation, drop targets,
    void effects).
  - Selection: off-window caret paints nothing (logical selection stays
    authoritative); ranges clamp to the window; after each edit
    `#scrollCaretIntoView` keeps the caret visible. Cmd+A → logical
    whole-document selection, mounted slice painted, `#virtualSelectAll` flag
    guards the selectionchange sync; copy/cut spanning past the window
    serializes from the model. Before unmounting a DOM-selection endpoint the
    DOM selection is dropped (`removeAllRanges`) so the sync can't misread
    the browser's re-anchor as a caret move.
- **DOM boundary** (`ship-editor.ts`): `mapDOMToPoint` → `BlockPoint`
  `{ blockIndex, itemIndex?, charOffset }` (bias-aware: container-anchored
  range boundaries from Cmd+A map to start-of-block[k] / end-of-block[k-1]);
  `flatPosOfBlockChar` / `blockPointAt` convert to/from flat.
- **Remote ops**: `remoteStepMap` reproduces `diffFlat`'s association
  semantics exactly (NOT `stepMapFromOp`'s — they disagree on 7.5% of mapped
  positions) while materializing only touched blocks. Oracle-fuzzed in
  `editor-remote-map.spec.ts`.
- Voids (hr/image): click-select any void (highlight = affordance), copy/cut
  serialize the block, paste over a selected void replaces it. Voids inside a
  text selection get `.sh-editor-void-in-selection`. All verified working at
  depth under virtualization.

## Invariants & safety nets

- `editor-columnar-sync.spec.ts`: columnar internal consistency (Fenwick
  starts, runs, parents) vs a fresh rebuild after every mutation path.
- `editor-remote-map.spec.ts`: remoteStepMap ≡ materialize+diffFlat oracle
  (400 fuzz + directed ties: identical-block chains, periodic text, voids —
  note `applyOp` treats a void's empty content as inline and splices into it).
- `editor-viewport.spec.ts`: height map splice/prefix/indexAt/estimate-lock.
  `editor-slice.spec.ts`: sliceDocument trims/marks/containers/voids.
- e2e (`scripts/editor-e2e/`, 25 specs): DOM ≡ AST under real Chromium input
  (21 original), plus `editor-virtual.e2e.ts`: DOM ≡ **mounted window** of
  the AST located via per-block index stamps, window follows scroll across
  3k blocks, typing/Enter/undo at depth, model-side select-all copy, small
  docs stay fully mounted.

## Traps (hard-won; do not rediscover)

- **Native scroll anchoring vs window splices**: swapping spacer padding for
  real blocks above the viewport reads to Chrome as content movement; its
  anchoring "corrects" scrollTop, which re-triggers a window update at the
  new position — a **permanent oscillation** (~2 states, one flip per rAF)
  that intermittently unmounted the caret's block mid-typing. Fix:
  `overflow-anchor: none` on the surface while virtualized (what CDK virtual
  scroll does). Symptom to recognize: unexplained scrollTop jumps ≈ one
  window's pixel span, caret dying after the first keystroke, e2e flaky
  ~40%. Diagnosed by hammering a probe spec logging scrollTop + window
  bounds per keystroke.
- **The height estimate must not drift**: a rolling average that keeps
  moving re-prices every unmeasured block at once → padding moves → content
  shifts under a fixed scrollTop → window oscillates. The average locks
  after 32 measurements (`ESTIMATE_LOCK_AFTER`); measured heights stay live.
  Scroll-anchor compensation runs on EVERY window reconciliation (anchor =
  first surviving block, or the scroll-chosen one on a rebuild) — prepends
  only was not enough: a long jump into unmeasured varied-height content
  re-prices the estimate mid-update and used to strand the viewport on
  blank spacer. Sub-pixel shifts are skipped, or the adjustment feeds back
  through the scroll event. Measuring is skipped for surfaces narrower than
  60px (hidden tabs measure nonsense the estimate would lock onto).
- **Position-space skew inside containers**: the Fenwick counts a container's
  closing token before its children; tree space puts it after. `pointAt`/
  `flatPosAt` correct by `depth`. Raw `posToRow`/`startOf` arithmetic inside
  containers is off by one.
- `ColumnarDocument.removeRows` must shift parent pointers (fixed; pinned).
- `setMarks` normalizes same-mark overlaps (fixed; layering runs is safe).
- The component's render effect must run **untracked** — it reads the live
  selection via restoreDOMSelection, and tracking it re-renders (and clobbers
  the DOM selection) on every selection change.
- Empty `class=""` left by classList.remove breaks the render cache's
  outerHTML equality — remove the attribute when it empties.
- Dev server (`ng serve design-system --port 4206`, from a shell): restart
  before trusting browser/e2e results (stale-HMR). Hidden Browser-pane
  timers get throttled — rAF-based probes stall **and the virtualization
  scroll handler is rAF-coalesced, so window updates freeze in a hidden
  pane** (correct for real tabs, confusing in the harness). Use
  MessageChannel yields in injected scripts; take a screenshot to front the
  pane before expecting rAF-driven behavior.
- On the `/editors` demo the scroll container is `<main>`, not the window —
  `window.scrollTo` does nothing there. `#findScrollContainer` walks
  ancestors for `overflow-y: auto|scroll`, falls back to the document.
- Copy-then-paste over the same selection is an identity edit — invisible by
  design; test paste with content that differs from the selection.
- `stepMapFromOp` must never replace diffFlat semantics (7.5% divergence).

## Performance state (live demo editor, virtualized)

| | 10k blocks before | 10k blocks now |
|---|---|---|
| initial render | ~1.7 s | ~25 ms |
| keypress (median) | ~19 ms | ~5 ms |
| Enter | ~24 ms | ~4 ms |
| undo | ~2 ms | ~2 ms |
| mounted DOM nodes | 10k blocks | ~52 blocks |

The old 10k keypress floor was Chrome laying out the whole flow; with ~52
blocks mounted it is gone, and cost no longer scales with document length —
60k behaves like 10k. The remaining ~5 ms is dominated by the value-serialize
effect (concatenating 10k cached block strings per keystroke) and the demo's
metrics counters (O(rows) text scan when `showMetrics` is on) — both
candidates below.

## Possible next steps (none blocking)

1. **Defer value serialization**: the component's value-sync effect calls
   `engine.serialize(format)` every version tick — O(blocks) string concat
   per keystroke even though every block is cached. Debounce to idle or make
   `value` pull-based; biggest remaining keypress win at 60k+.
2. **Decoration re-application on remount**: a void inside the live selection
   that scrolls out and back in loses `.sh-editor-void-in-selection` until
   the next render (elements rebuild from the cache, classes are effect-
   applied). Cosmetic; re-apply decorations in `#updateVirtualWindow` if it
   ever matters.
3. **`rowOfTopLevel`/`topLevelCount` are O(rows) scans** — fine at 60k
   (tens of µs, a handful of calls per keystroke), but an index would drop
   them to O(1) if profiling ever surfaces them.
4. Drag-to-reorder across the window edge (drag auto-scroll) was out of
   scope; dropping is window-local today.

## Verify workflow (all four, from repo root)

1. `node node_modules/@angular/cli/bin/ng.js test ship-ui --watch=false`
   (ship-code perf specs are wall-clock flaky; re-run once).
2. `node node_modules/@angular/cli/bin/ng.js build ship-ui` (typecheck gate).
3. Restart `ng serve design-system --port 4206`, then drive
   `window.ng.getComponent(document.querySelector('sh-editor')).engine` at
   `/editors` (Examples tab). Synthetic keydowns don't reach handlers;
   dispatch `beforeinput`/`paste` events or call engine methods.
4. `EDITOR_E2E_PORT=4206 npx playwright test -c scripts/editor-e2e/playwright.config.ts`
   (run the suite 2–3×; the virtualization flake class above was only
   visible under repetition).

Conventions: concise bullet-style replies; commit in coherent units with
explanatory messages; **never** add a Co-Authored-By trailer.
