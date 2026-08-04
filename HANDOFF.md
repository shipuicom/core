# Handover — editor columnar model

State of `editor-columnar-model` as merged into `main`.

## What landed

| Area | Summary |
| --- | --- |
| `@ship-ui/core/ship-sheet` | New read-only spreadsheet family: columnar cell model with invertible ops, table serialize/parse, TSV + HTML clipboard, virtualized view with multi-range selection, and an editor block. Demo at `/sheet`. |
| `@ship-ui/core/ship-code` | Multi-cursor (on by default), line move across cursor groups, a batched edit path, and caret hit-testing fixes. **Not published — see below.** |
| `@ship-ui/core/ship-editor` | Multi-cursor (off by default), block move, and four selection/render correctness fixes. |

## ship-code is gated out of the package

`projects/ship-ui/ship-code/ng-package.json` is renamed to
`ng-package.json.disabled`, so `ng build ship-ui` skips it. The vendored
TextMate bundles ship a `main.js` beside a hand-written `main.d.ts`;
TypeScript resolves the declaration and never compiles the JavaScript, so
ng-packagr cannot resolve the import. See `projects/ship-ui/ship-code/PACKAGING.md`
for the ways out.

An earlier handover called this failure pre-existing. It is not: `main` built
cleanly before this branch, and the TextMate engine that breaks the build was
added on it. Re-enabling the entry point is the one real piece of follow-up
work.

Nothing in the library imports ship-code, and the design-system demo resolves
it from source through the `@ship-ui/core/*` path mapping, so both keep
working while it is gated.

## Verification

- **Unit:** `bun run test -- --exclude "**/.claude/**" --watch=false` → 941 passing.
- **E2E:** `EDITOR_E2E_PORT=4206 npx playwright test -c scripts/editor-e2e/playwright.config.ts` → 50 passing.
- **Package:** `bun run build:prod` (what CI runs) → green.
- `projects/ship-ui/ship-code/core/general-tests/perf.spec.ts` holds a 5ms
  budget that flakes when the machine is busy. Re-run it quiet before
  believing a failure.

## Working notes

- **Dev server:** `node node_modules/@angular/cli/bin/ng.js serve design-system --port 4206`.
- **A failed rebuild is silent from a test's point of view.** Angular keeps
  serving the last good bundle, so a browser check can pass against code that
  no longer exists. When a result surprises you, prove the build is live —
  put a marker on a component, assert it from the page, and only then trust
  the run. This cost real time; it is the single most useful thing to know
  about this repo's feedback loop.
- **Assert rendered text, not just structure.** Two bugs here produced a
  correct AST and a wrong screen; type-level assertions saw nothing. The
  e2e suite now compares DOM text against model text block for block.
- Demo pages register in three places: `app.routes.ts`, `layout/layout.html`,
  and the spotlight list in `app.config.ts`. The `/code` and `/sheet` nav
  entries are commented out until those components ship; the routes stay
  reachable by URL so demos and e2e keep working.

## Next

1. Fix the ship-code vendor packaging and re-enable the entry point.
2. ship-sheet phases still out of scope: formulas, sorting, cell types, and
   the editable `ShipSheet` that composes `ShipSheetView` rather than
   reimplementing its rendering.
3. In ship-editor, a drag that ends on a component block paints up to the
   block's boundary while the model owns the block. That is deliberate, but
   it means the highlight is slightly wider than the paint.
