# MCP generation — findings & target output spec

Investigation of the ShipUI MCP pipeline (2026-07-17). Pipeline:
`scan.ts` (scraper) → `components.json` (index) → `index.ts` (stdio server: resources/tools/prompts).
The **server is fine**; quality is lost in `scan.ts`.

## Current state (measured)

- **48 entries** in `components.json`. Of the 68 real selectors in source:
  **48 present, 20 missing.**
- Generated `Jul 11`; source changed since (`ship-editor` landed `Jul 17`) → also stale.

### Core defect: one selector + one class *per file*
`scan.ts` does a single `selector:` match and a single `export class` match per file,
then scrapes inputs/methods/CSS across the **whole file**. Multi-component files collapse to
their first class, with a merged/misleading API.

| File | In source | In index |
|---|---|---|
| `ship-tree.ts` | 6 (`sh-tree`, `sh-tree-node`, 3 icon dirs…) | only `sh-icon[openIcon]`/`ShipTreeOpenIcon`; **`sh-tree` absent** |
| `ship-table.ts` | 5 (`sh-table`, `[shSort]`, `[shStickyColumns]`…) | only `[shResize]`/`ShipResize`; **`sh-table` absent** |

**20 missing selectors** include flagships `sh-table`, `sh-tree`, `[shTooltip]`, and the whole
`sh-editor-*` toolbar family (`sh-editor-toolbar`, `-floating-toolbar`, `-contextual-toolbar`,
`-slash-menu`, `-link-popover`, `-image-popover`, `-image-resize`, `[shEditorAction]`).

### Secondary problems
- **Noise (~11 entries)** that shouldn't be public: fixture `app-child`
  (from `src/lib/utilities/create-input-example.component.ts`; its reported name `ChildComponent`
  doesn't even match the source class — multi-class fragility again), plus internal
  `*-wrapper` / `*-container` / `*-registry` / `*-service` pieces.
- **Lossy API extraction:** regex method scan leaks private helpers (`sh-editor` reports 50 methods).
- **Fragile descriptions:** scraped from a specific `<app-property-viewer>` HTML shape in the
  design-system docs — which is being refactored (the editors Overview tab just dropped that
  element), so descriptions silently drift.
- **Dead path:** still scans `src/lib`, which now holds only `utilities/` fixtures → sole source of `app-child`.

## Target "great expected output"

One entry **per component/directive** (never per file):

```jsonc
{
  "name": "ShipTable",
  "selector": "sh-table",
  "package": "@ship-ui/core/ship-table",   // entry-point import path
  "kind": "component",                      // component | directive | service
  "file": "projects/ship-ui/ship-table/ship-table.ts",
  "description": "…",                       // decoupled from a single HTML shape
  "keywords": ["table", "data grid", …],
  "inputs":  [{ "name", "type", "default", "options": ["…"], "description" }],
  "outputs": [{ "name", "type", "description" }],
  "methods": [{ "name", "parameters", "returnType", "description" }],  // PUBLIC only
  "cssVariables": [{ "name", "default", "description" }],
  "examples": [{ "name", "html", "ts" }]
}
```

Acceptance criteria for a rewrite:
1. All 68 source selectors present; multi-component files fully expanded.
2. Zero fixtures / internal-only pieces (blocklist or an explicit "public" marker).
3. Per-class API only (no cross-class method/input bleed); private members excluded.
4. Descriptions sourced without depending on one exact docs HTML structure.

## Build — DONE (2026-07-17)
`scan.ts` was rewritten to a per-**class** pass on the TypeScript compiler API
(`ts.createSourceFile` → walk `ClassDeclaration`s → decorators + `input()`/`output()`/`model()`
+ JSDoc from the AST). Key rules:

- **Membership = public-API export.** Scan only the `.ts` files reachable by following
  `export … from './x'` chains out of each entry dir's `public-api.ts`. This is the project's
  own public/internal boundary — it *includes* previously-missing pieces (`sh-table`, `sh-tree`,
  `[shTooltip]`, the `sh-editor-*` family) and *excludes* non-exported internals
  (`ship-tooltip-wrapper`) and `src/lib` fixtures (`app-child`) automatically.
- **One entry per decorated class** — no more first-class-wins collapse on multi-component files.
- **Methods** exclude `#private`/`private`/`protected`, lifecycle hooks, `@HostListener`,
  CVA plumbing, and any handler referenced in `host` metadata or the template
  (`sh-editor` went 50 → 1 method).
- **Inputs** carry `type`, `default`, `options` (resolved from `ship-types.ts` `__SHIP_*` unions
  or inline string-literal unions), and `twoWay` for `model()`.
- Each entry gains `package` (`@ship-ui/core/<entry>`), `kind`, and `selectorAliases`.

Result: **58 (11 noise / 20 missing / several wrong) → 79 correct entries**, verified against a
hand-authored spec (`sh-button`, `sh-table`, `sh-editor` → 7 classes): all assertions pass.
Regenerate with `bun run mcp:update`; rebuild the bundled server with `bun run mcp:prep`.
