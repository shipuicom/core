# Editor handover: columnar migration done, virtualization next

Branch: `editor-columnar-model` (main repo, no worktree). All work committed,
tree clean, 674 unit tests + 21 Playwright e2e green at time of writing.

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
  still collapses after the content.
- **Rendering**: engine keeps a per-block HTML cache + `RenderHint` queue
  (`block` = re-render one element, `splice` = DOM splice with untouched
  suffix, `all` = full pass). `serialize('html'|'markdown')` assembles from
  per-block caches; `serialize('json')` = `fromColumnar`. The component's
  `patchDOM` replays hints; inline edits patch **text data in place** and the
  caret restore skips `addRange` when the DOM selection already matches.
- **DOM boundary** (`ship-editor.ts`): `mapDOMToPoint` → `BlockPoint`
  `{ blockIndex, itemIndex?, charOffset }` (bias-aware: container-anchored
  range boundaries from Cmd+A map to start-of-block[k] / end-of-block[k-1]);
  `flatPosOfBlockChar` / `blockPointAt` convert to/from flat.
- **Remote ops**: `remoteStepMap` reproduces `diffFlat`'s association
  semantics exactly (NOT `stepMapFromOp`'s — they disagree on 7.5% of mapped
  positions) while materializing only touched blocks. Oracle-fuzzed in
  `editor-remote-map.spec.ts`.
- `editor-ast.utils.ts` is 41 lines: `normalizeInlineNodes` +
  `resolveInlinePosition` only. `TreeSelection`/`TransactionResult` are gone.
- Voids (hr/image): click-select any void (highlight = affordance), copy/cut
  serialize the block, paste over a selected void replaces it. Voids inside a
  text selection get `.sh-editor-void-in-selection`.

## Invariants & safety nets

- `editor-columnar-sync.spec.ts`: columnar internal consistency (Fenwick
  starts, runs, parents) vs a fresh rebuild after every mutation path.
- `editor-remote-map.spec.ts`: remoteStepMap ≡ materialize+diffFlat oracle
  (400 fuzz + directed ties: identical-block chains, periodic text, voids —
  note `applyOp` treats a void's empty content as inline and splices into it).
- e2e (`scripts/editor-e2e/`, 21 specs): DOM ≡ AST under real Chromium input,
  incl. CDP IME, select-all paste, void copy/paste, in-selection highlight.

## Traps (hard-won; do not rediscover)

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
  timers get throttled — use MessageChannel yields in injected test scripts,
  and don't mistake harness stalls for app hangs (this cost hours twice).
- Copy-then-paste over the same selection is an identity edit — invisible by
  design; test paste with content that differs from the selection.
- `stepMapFromOp` must never replace diffFlat semantics (7.5% divergence).

## Performance state (median, live demo editor)

| | 1k blocks | 10k blocks |
|---|---|---|
| keypress | ~2.5 ms | ~19 ms |
| Enter / undo | ~3 ms | ~24 / ~2 ms |
| selection move | 1.3 ms | 0.7 ms |

The 10k keypress floor is **Chrome's layout of the flow itself**: a forced
layout after a one-character change measures 1.2/3.4/14.5 ms at 1k/3k/10k
with no editor code involved. `content-visibility: auto` measured worse
(~80 ms). Engine-side costs are sub-millisecond throughout.

## THE TASK AHEAD: viewport virtualization (vim-scale, 60k+ lines)

Goal: only blocks in and around the viewport exist in the DOM; everything
else is virtual. This removes the layout floor and the load-time full render
(1.7 s at 10k today).

Why the architecture is ready for it:

- Row starts/sizes are O(log n) via the Fenwick → viewport(scrollTop,height)
  → block range is a lookup (needs a pixel-height model, see below).
- `patchDOM` is already hint-driven and renders arbitrary block indices from
  the per-block HTML cache.
- Selection is flat; `flatPosOfBlockChar`/`blockPointAt` don't care whether
  an element is mounted.

Design sketch / decisions to make:

1. **Height model**: measured heights per top-level block (cache actual
   heights after render; estimate unmeasured ones, e.g. rolling average) in a
   Fenwick over pixels for scroll↔block mapping. Top/bottom spacer divs (or
   padding) stand in for unmounted ranges.
2. **Window management**: mount [firstVisible − overscan, lastVisible +
   overscan]; on scroll, splice edges (the hint machinery generalizes).
   `#indexInParent` and `container.children[i]` become window-relative —
   introduce an explicit `domIndex = blockIndex - windowStart` at the
   boundary (mapDOMToPoint, patchDOM, restoreDOMSelection, the highlight
   effects, drop-indicator math).
3. **Selection/caret off-window**: restoreDOMSelection must no-op (or scroll
   to caret) when the caret block is unmounted; typing always happens in the
   window. Cmd+A + copy must still produce the full document's clipboard
   content — the native copy of a partial DOM won't; intercept copy when the
   selection spans off-window content and serialize from the model
   (`onCopy` already exists for the void path).
4. **The e2e invariant** becomes DOM ≡ visible window of the model; the
   suite needs a helper that scrolls a block into view before asserting.
5. Keep it **opt-in or threshold-based** (e.g. virtualize beyond N blocks)
   to avoid destabilizing small documents; spacers + contenteditable quirks
   (caret at window edges, drag-scroll) need real-browser testing throughout.

## Verify workflow (all four, from repo root)

1. `node node_modules/@angular/cli/bin/ng.js test ship-ui --watch=false`
   (ship-code perf specs are wall-clock flaky; re-run once).
2. `node node_modules/@angular/cli/bin/ng.js build ship-ui` (typecheck gate).
3. Restart `ng serve design-system --port 4206`, then drive
   `window.ng.getComponent(document.querySelector('sh-editor')).engine` at
   `/editors` (Examples tab). Synthetic keydowns don't reach handlers;
   dispatch `beforeinput`/`paste` events or call engine methods.
4. `EDITOR_E2E_PORT=4206 npx playwright test -c scripts/editor-e2e/playwright.config.ts`

Conventions: concise bullet-style replies; commit in coherent units with
explanatory messages; **never** add a Co-Authored-By trailer.
