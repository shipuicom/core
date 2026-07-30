# ship-sheet — Handover

**Mission:** build `@ship-ui/core/ship-sheet` — a signal-based spreadsheet component
family that attaches to `sh-editor` documents as a component block. Read-only
viewer first; the editable sheet is a later layer on the same core.

This document is self-contained: it captures the design decisions already made,
the existing infrastructure the sheet builds on, and the repo workflow. Start
here; read the referenced files before writing code.

---

## Locked design decisions (do not relitigate casually)

### 1. Three-tier consumption, view/editor split
The CodeMirror-style layering, dependency arrow pointing one way only
(editor → view):

- **Static HTML** — the document serializer emits a real `<table>`; published
  pages/SSG docs/emails get semantic, styleable markup with zero JS.
- **`ShipSheetView`** — the lean renderer. Immutable model snapshot (or signal)
  in, plus display-state inputs (selection ranges, sticky headers). Two-axis
  virtualization, cell painting, copy-out. It does not know editing exists.
- **`ShipSheet`** (later phase) — owns the model + op stream, composes the view
  (never reimplements rendering), handles keyboard/mouse, and floats a
  cell-editing overlay **above** the view — the same overlay pattern ship-code
  uses for its caret/selection (`projects/ship-ui/ship-code/sh-code.html`).

Bundle honesty: a `ShipSheet` with `readonly=true` still ships editing code
(readonly is a dynamic signal). The lean path is positional: display-only
surfaces import `ShipSheetView` directly. One entry point with clean class
boundaries is fine to start; splitting into two entries later is mechanical
because the dependency direction is clean.

### 2. Columnar core, ops from day one, signals at the view boundary only
Third instance of the house pattern (ship-editor: rows = blocks; ship-code:
rows = lines; ship-sheet: rows × cols = cells):

- Framework-agnostic core: columnar cell storage (typed/flat arrays where it
  pays), column widths / row heights as columns.
- **Do NOT make every cell a signal** — a 50k-cell sheet with per-cell
  `computed()` is graph overhead. Formulas (phase 2) get their own topological
  dirty-propagation in the core. Signals exist only at the view boundary:
  visible-window state, selection, a version counter (see how
  `projects/ship-ui/ship-code/sh-code.ts` uses `#tokensVersion`/`visibleLines`).
- **Ops-based change model from day one** even though v1 persists whole state
  into block attrs: attr updates rebase in the editor as whole-block
  last-writer-wins, which collapses concurrent cell edits. If sheet changes
  are already ops (with inverses, like `core/flat-edit.ts` in ship-code),
  bridging into the editor's collab stream later is a mapping problem, not a
  rewrite.

### 3. Virtualization: reuse BlockHeightMap on both axes
`BlockHeightMap` (`@ship-ui/core/ship-virtual-scroll`, moved there from
ship-editor precisely to be shared) is an axis-agnostic prefix-sum over
measured sizes with estimate locking. Use one instance for rows, one for
columns. Reference implementations of the windowing loop: ship-code's
`#updateWindow` (simple, uniform heights) and ship-editor's
`#updateVirtualWindow` (measured heights, scroll anchoring).

### 4. Serialization is a real `<table>`
The document behavior's `renderHTML` emits semantic `<table>` markup;
`parseDOM` accepts **any** `<table>` element. Consequences: documents
round-trip through HTML portably, AND pasting a table from Excel / Google
Sheets / Word materializes as a ship-sheet block — this is deliberately part
of the table-paste-fidelity story. Note: the editor's HTML sanitizer allowlist
(`projects/ship-ui/ship-editor/editor-sanitize.ts`, `ALLOWED_TAGS`/`TAG_ATTRS`)
does not currently include `table/tr/td/th/thead/tbody/colgroup/col` — extend
it (precedent: `div: ['data-sh-block', 'data-sh-attrs']` was added for
component blocks).

### 5. Document attachment via the component-block API (no editor changes)
`BaseComponentBlockBehavior` + `SHIP_EDITOR_BLOCK_CONTEXT`
(`projects/ship-ui/ship-editor/sh-editor-component-block.ts`) already provide
everything: clicks pass through to the component (unless nothing interactive
was hit — then the click falls through and selects the block); while focus is
inside, the editor intercepts **nothing** (arrows/Tab/Enter are sheet
navigation); `context.select()` hands control back (bind Escape at the sheet
edge); `attrs`/`selected`/`readonly` arrive as signals; `updateAttrs(patch)`
is one undoable transaction. Block attrs are the only state that survives
serialization, undo/redo, and virtualization unmounts.

**Batch attr commits per cell-exit, not per keystroke** — the code-pad demo
(`projects/design-system/src/app/ship/editors/sh-editor-demo-blocks.ts`)
commits per keystroke and pollutes the undo stack; don't copy that.

### 6. DOM leanness is a stated requirement
The user explicitly cares (see ship-code's evolution): prefer bare text nodes
over spans, short generated classes over long semantic ones, one host CSS
variable over per-element inline styles, `[innerHTML]` built from escaped
strings over template `@for` when anchor comments would bloat the DOM.
ship-code's style-bucket system (`#bucketFor` in `sh-code.ts`: `t1…tn` classes
+ one uid-scoped generated stylesheet, sanitized color values) is the model —
a sheet with themed/formatted cells should use the same approach.

### 7. Read-only MVP scope (this session's target)
1. Secondary entry `projects/ship-ui/ship-sheet/` (`ng-package.json` +
   `public-api.ts`; the `@ship-ui/core/*` tsconfig wildcard already resolves it).
2. Columnar cell core + spec (values, column widths, row heights; ops with
   inverses defined even if the viewer never mutates).
3. `ShipSheetView`: two-axis BlockHeightMap windowing, sticky row/column
   headers, rectangular selection display + keyboard-free copy-out (TSV +
   HTML flavors), `<table>` (de)serialization helpers.
4. `ShipSheetBlockBehavior` for sh-editor (view-mounting; editable upgrade
   later) + sanitizer allowlist extension.
5. Demo page + docs dogfooding; specs; the four verify gates below.

Formulas, sorting, cell types, and the editable `ShipSheet` are explicitly
later phases.

---

## Files to read first

- `projects/ship-ui/ship-editor/sh-editor-component-block.ts` — the attachment
  API and its interaction contract (JSDoc is the spec).
- `projects/ship-ui/ship-code/sh-code.ts` + `sh-code.html` + `sh-code.scss` —
  the house pattern end-to-end: columnar core consumption, windowing, overlay
  painting, style buckets, `[innerHTML]` lines, host CSS vars, SSR guards.
- `projects/ship-ui/ship-virtual-scroll/height-map.ts` — the shared prefix-sum
  model (and its spec).
- `projects/ship-ui/ship-code/core/flat-edit.ts` — the inverse-returning op
  shape to mirror.
- `projects/design-system/src/app/ship/code/code.ts` — demo-page wiring incl.
  the SSR guard pattern (`typeof window === 'undefined'` around field-init
  `fetch`; unguarded fetch crashed the SSR dev server once already).

## Repo workflow (hard-won; follow it)

- **Branch:** `editor-columnar-model` in `/Users/simon/Documents/dev/ship-ui`.
  Something occasionally flips the checkout externally — verify
  `git branch --show-current` before editing. Never add a Co-Authored-By
  trailer to commits.
- **Dev server:** `node node_modules/@angular/cli/bin/ng.js serve design-system
  --port 4206` from a shell (preview_start cannot spawn it); attach the
  browser at `http://localhost:4206/...`. **HMR goes stale** — restart for a
  clean compile before trusting browser/e2e results.
- **Verify gates (all four):** `bun run test` (canonical vitest; resolve
  fixture paths from `process.cwd()` — `__dirname`/`import.meta.url` are
  rewritten by the transform; a stale `.claude/worktrees/` copy pollutes broad
  ad-hoc filters, use `--exclude "**/.claude/**"`); `ng build ship-ui` (the
  typecheck gate — vitest does not typecheck); browser check via
  `window.ng.getComponent(el)` (in the hidden pane, rAF never fires and
  zoneless CD lags one flush — `window.ng.applyChanges(comp)` before DOM
  asserts; scroll handlers need the rAF+timeout fallback pattern, see
  `#onScroll` in sh-code); `EDITOR_E2E_PORT=4206 npx playwright test -c
  scripts/editor-e2e/playwright.config.ts` (34 specs) must stay green.
- **Demo page registration:** route in `app.routes.ts` + nav button in
  `layout/layout.html` + spotlight entry in `app.config.ts` (copy the
  `/code` page's registration).
- **Static demo assets:** add to `angular.json` design-system assets (see the
  `onig.wasm` entry) — requires a dev-server restart.

## Context on the broader arc (why the sheet exists)

Tables were identified as ship-editor's biggest schema gap vs
TinyMCE/Tiptap. The decision: tables live as a widget with its own model
(Notion-style), not as document-native schema — the flat columnar document
treats a component block as size 1, so sheet-cell content is intentionally
outside document selection/find/collab for now. The `<table>` parse path is
what recovers paste fidelity. Collab groundwork exists in the editor
(invertible ops + rebasing); the sheet's op model is what keeps a future
cell-level collab bridge possible.
