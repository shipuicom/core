# Migration Guide

## v0.26.0 — component structure normalisation

Every component's scss now follows [COMPONENT-STRUCTURE.md](./COMPONENT-STRUCTURE.md) (`bun run lint:structure`
checks it). A migration script (`ship-migrate`) that rewrites the renames below is shipped alongside this release.

**Removed inputs** (they never rendered anything):
- `color` on `sh-card`, `sh-button-group`, `sh-table`, `sh-toggle-card`
- `variant` on `sh-tabs`; `sh-accordion`'s `variant` is narrowed to `ShipAccordionVariant` (`'type-b' | ''`)

**Renamed CSS variables** (override sites in your scss):
| old | new |
|---|---|
| `--breadcrumbs-*` | `--crumb-*` |
| `--box-bc`, `--box-bw` (sh-checkbox) | `--cb-bc`, `--cb-bw` |
| `--miw` (sh-select) | `--select-miw` |
| `--caret-color`, `--caret-size` (sh-table) | `--table-caret-c`, `--table-caret-si` |
| `--stepper-progress` | `--step-progress` |
| `--overlay` (sh-popover sheet backdrop) | `--po-overlay` |

**Renamed classes** (old names keep working until v0.27):
- `.warning` → `.warn` on `sh-form-field`, `sh-tree` badges, `sh-list-item-swipe` actions
- `.danger` → `.error` on `sh-list-item-swipe` actions and `sh-editor` toolbar actions

**SHIP_CONFIG**
- `alertVariant`, `cardType`, `tableType` are gone: set `alert: { variant }`, `card: { variant }`, `table: { variant }` instead.
- The `'event-card'` key is now `eventCard`.
- `ShipAlertModule` is removed (every component is standalone; import `ShipAlert` / `ShipAlertContainer` directly).
- The unpublished `sh-form-field-experimental` entry point is deleted.

**Renamed classes (TypeScript)**
- `ShEditorRemoteCursors` → `ShipEditorRemoteCursors`, `ShEditorCollabDirective` → `ShipEditorCollabDirective`,
  `ShSpreadsheetRemoteSelections` → `ShipSpreadsheetRemoteSelections`. Entry points and selectors are unchanged.

**Sass flags** (only matter if you `@use '@ship-ui/core/styles' with (...)`):
- `$shipPage`, `$shipSection`, `$shipSetting`, `$shipEmptyState`, `$shipStat`, `$shipStatTrend`, `$shipStatGoal`, `$shipStatRing`,
  `$shipRanking`, `$shipAchievement`, `$shipInbox`, `$shipTableView`, `$shipDetails`, `$shipTimeline`, `$shipToolbar` are now
  `$shipLayoutPage` … `$shipLayoutToolbar`
- `$shipSortable` now controls a global include (the `[shSortable]` directive styles no longer ride along with `sh-tree` / `sh-list`)

**Padding tokens**
- Global density: `--pad-y` / `--pad-x` (8px / 12px) with tiers `--pad-{y,x}-{xs,s,m,l,xl,2xl,3xl,4xl}` derived by multiplier.
  Every padded component reads a tier through its own `--<abbr>-py` / `--<abbr>-px`; override the base pair for a denser
  or airier app, a tier for one size class, or a component's pair for that component.
- The one-value tokens are gone: `--card-p`, `--alert-p`, `--chat-p`, `--list-p`, `--list-item-p`, `--dialog-p`, `--editor-p`,
  `--crumb-p`, `--crumb-item-p`, `--btng-p`, `--acc-pad`, `--table-th-p`, `--table-td-p`, `--ff-space`, `--ff-input-space` and the
  layout `--<abbr>-p` tokens each became a `-py` / `-px` pair (`ship-migrate` points at every use).
- Values snapped to the tiers; the shifts are 1–4px: chip xsmall 6→4px, list padding 20→16px, list type-b rows 10→8px,
  form-field 9→8px (small 7/10→8/8px), dialog/popover/event-card/toggle-card 16→20px horizontally, kbd 1→2px vertically.

**Skins and palettes (additive)**
- Variant × colour styling moved from each component's stylesheet into the global stylesheet as list-driven skins. Nothing
  changes by default; `@use '@ship-ui/core/styles' with ($shipColors, $shipVariants, $shipSkins, $ship<Name>: false)` now
  really strips what you do not use (see README → Skins and palettes). If you never imported `@ship-ui/core/styles`, you must:
  the components' variant and colour classes no longer style themselves.
- `$shipPalettes: (brand: (200, 80%, 45%))` adds a palette (`--brand-1..12`, `-g2`, `-g3`, `-c8`) and a `.brand` class on every skin;
  `ShipColor` accepts any palette name. `$shipPaletteSteps` limits the emitted steps.

**Other**
- `sh-avatar` name hues are derived from the primary palette (rotated in 45° steps) instead of fixed oklch pairs.
- The `.status-badge` / `.delete-btn` demo styles left `sh-tree`; copy them from the docs' template-tree example if you relied on them.
- Contrast text on coloured surfaces (toggle knob, radio dot, range-slider thumb value, datepicker selection) now reads `--<color>-c8`
  instead of `#fff`, so custom palettes with light `-8` steps get dark text automatically.

> [!IMPORTANT]
> **v0.25.0**: the spreadsheet moved — `@ship-ui/core/ship-sheet` is now `@ship-ui/core/ship-spreadsheet`, `ShipSheetView` is `ShipSpreadsheet` (`<sh-spreadsheet>`), and `ShipSheetBlockBehavior` is `ShipSpreadsheetBlockBehavior`. Angular `>= 20` remains the supported floor.

# Upgrading to Secondary Entry Points

Starting with version `0.21.0`, ShipUI has transitioned from a single unified bundle import to a **Modular Secondary Entry Points** architecture. This guide walks you through why we made this change and how to update your codebase.

> [!NOTE]
> **Update (v0.23.0)**: The remaining core directives (`ShipTooltip`, `ShipInputMask`, `ShipFileDragDrop`, and `ShipPreventWheel`) have also been moved to their respective secondary entry points (e.g. `@ship-ui/core/ship-tooltip`). If you are using these directives in your application, you must update their import paths.

---

## Why Secondary Entry Points?

Previously, all components were exported from the main `@ship-ui/core` entry point. While convenient, this had several drawbacks:
1. **Slower Dev Server (HMR)**: During development (`ng serve`), changing a single file forced the Vite dev server to compile and load all 35+ components and their styles, resulting in slower hot-reload times.
2. **Fragile Tree-Shaking**: If a single component or utility in the main bundle contained a side-effect, the bundler was forced to include the entire library in your production bundles, causing bundle bloat.
3. **IDE Performance**: Autocomplete and type checking were slower because the TypeScript language server had to parse the entire package at once.

Under the new model, each component is built and served as a separate, self-contained sub-package (e.g., `@ship-ui/core/ship-button`), yielding **faster development startup/reload times, smaller production bundles, and a snappier IDE experience**.

---

## Step-by-Step Migration

### 1. Update TypeScript Component Imports

You must separate component imports from the main `@ship-ui/core` entry point and direct them to their respective subpaths.

#### ❌ Before:
```typescript
import { Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipCard, ShipTooltip } from '@ship-ui/core';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [ShipButton, ShipIcon, ShipCard, ShipTooltip],
  template: `...`
})
export class MyFeatureComponent {}
```

####  After:
```typescript
import { Component } from '@angular/core';
// Components and directives import from their respective secondary entry points
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

// Global utilities continue to import from the primary entry point
import { shipComponentClasses } from '@ship-ui/core';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [ShipButton, ShipIcon, ShipCard, ShipTooltip],
  template: `...`
})
export class MyFeatureComponent {}
```

### 2. Verify Stylesheet Setup

The global stylesheet configuration remains backward compatible. Ensure your application's `styles.scss` continues to load the root variables, sheet utility, and basic resets:

```scss
@use '@ship-ui/core/styles';
```

If you configure shadow styles or font setups, make sure to pass them down:

```scss
@use '@ship-ui/core/styles' with (
  $useInterTight: true,
  $shipButtonShadow: true,
  $shipFormFieldShadow: true
);
```

### 3. Verify Asset Glob Mapping (`angular.json`)

Double check your `angular.json` configuration. Ensure the input directory resolves to the scoped package:

```json
"assets": [
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/@ship-ui/core/assets",
    "output": "./ship-ui-assets/"
  }
]
```
