# Changelog

## Unreleased

### Changed

- **ship-sortable**: every sortable reorders on touch with a long press. `touchEnabled` now defaults to `true`
  (`touchActivation` stays `'longpress'`): a touch held still for 300ms picks the item up, a touch that moves first
  still scrolls, and a two-finger touch never picks anything up. Mouse drags still start immediately and keyboard
  reordering is unchanged. `[touchEnabled]="false"` (or `touchActivation="none"`) restores scroll-only touch; see
  [MIGRATION.md](./MIGRATION.md).
- **ship-sortable**: the long-press `touchstart` listener is passive, the context menu / iOS callout is held off while
  a touch is pressed, and a touch drop no longer also clicks the item under the finger.

## 0.27.1

### Fixed

- Small form fields (`sh-form-field.small`, `sh-form-field-popover.small`, small datepicker / daterange inputs) are
  32px tall again; since 0.26.0 they rendered at the default 40px.

## 0.27.0

Lazy skins and the `ship` cascade layer. Read [MIGRATION.md](./MIGRATION.md).

### Changed

- Each component carries its own variant × colour styles again, written once against `--c-*` tokens that a colour
  class (`.primary`, `.brand`, …) points at its palette. The default global stylesheet goes from 66 kB to 22 kB
  (8.4 → 4.4 kB gzip) and no longer grows with components an app does not use. Custom `$shipPalettes` colour classes
  work on every component.
- All ShipUI CSS is in `@layer ship`: unlayered app CSS overrides it without `!important` or higher specificity.
- `$ship<Name>` flags and `$shipSkins` only affect the global skins (`sheet`, `tooltip`, `avatar`); `ship-migrate` flags
  the others as not honoured.

### Fixed

- Uncoloured flat and raised selected `sh-chip`s keep their fill (they rendered transparent).
- Coloured `sh-list-item-swipe` actions use the palette's contrast text, not `--base-1` (dark text in dark mode).

## 0.26.0

Component structure normalisation. This release renames tags, CSS custom properties, classes and config keys; run
`npx ship-migrate --dry-run`, then `npx ship-migrate`, and read [MIGRATION.md](./MIGRATION.md) for the changes to make
by hand.

### Breaking

- Every component tag is `sh-*` (`<sh-theme-toggle>`; `<ship-alert-container>` keeps working until 0.27).
- About 40 CSS custom properties follow the `--<abbr>-<style>[-<state>]` naming (tree, list, datepicker, sidenav,
  video, editor, avatar, code, spreadsheet, button, ranking); the `$ship*Shadow` flags now set `--btn-bs` / `--ff-bs` /
  `--chip-bs` on `:root` instead of `--ship-*-shadow`. Full table in MIGRATION.md.
- Single padding tokens (`--card-p`, `--list-p`, …) became `-py` / `-px` pairs fed by the new `--pad-y` / `--pad-x`
  density tiers.
- Variant × colour styling moved into the global stylesheet as skins: import `@ship-ui/core/styles`, or the variant and
  colour classes no longer style anything.
- `shipComponentClasses` no longer stamps a `base` class on hosts without a variant.
- Removed inputs that never rendered anything (`color` on card, button-group, table, toggle-card; `variant` on tabs).
- `SHIP_CONFIG`: `alertVariant` / `cardType` / `tableType` → `alert` / `card` / `table` `{ variant }`; `'event-card'` →
  `eventCard`. `ShipAlertModule` is removed; `Sh*` collab classes are `Ship*`.
- `sh-form-field` `.warning` → `.warn` (alias kept until 0.27).

### Added

- **ship-code**: `@ship-ui/core/ship-code` is published. The document is a persistent B-tree of lines, so edits and
  line/offset lookups are O(log n): typing in a 50,000-line file costs about 3 µs per keystroke in the model. `value`
  and the form control update when typing pauses, on blur and on `flushValue()` (`valueSync` input: `'idle'` default,
  `'immediate'`, `'blur'`).
- **ship-migrate** CLI: rewrites a release's renames in templates (`.html`, inline templates) and styles, warns with
  file:line on anything it cannot decide, `--dry-run`, `--to <version>`, `--help`.
- **ship-styles** CLI: turns the docs config editor's `ship-config.json` / `ship-styles.json` into the
  `@use '@ship-ui/core/styles' with (...)` block.
- Skins: `$shipColors`, `$shipVariants`, `$shipSkins` and `$ship<Name>: false` strip unused styling; `$shipPalettes`
  adds palettes with a colour class on every skin; `$shipPaletteSteps` limits emitted steps.
- `--font-family` token read by the whole type scale.
- `optionalBooleanAttribute` utility; boolean inputs across ~25 components accept attribute syntax
  (`<sh-checkbox readonly>`).
- `ShipConfig` keys for `avatar`, `chartSparkline`, `colorPickerInput`, `editor`, `themeToggle`, `video`,
  `videoPlaylist`, and those components honour them.

### Fixed

- `sh-alert-container` with `inline` no longer toggles the floating stack on hover.
- `sh-code-input`, `sh-lo-stat-goal`, `sh-lo-ranking-item` and `sh-lo-setting` get accessible names from their slotted
  labels, and `sh-lo-setting` keeps that wiring correct when controls render late, are nested, or are named by you.
- `sh-editor` `variant="base"` overrides a project default of `document`; the toolbar reads its `--editor-*` tokens.
- Selected `simple` / `outlined` chips fill with the selection colour; contrast text on coloured surfaces reads
  `--<color>-c8`, so light custom palettes get dark text.
- Shared stylesheets are split per component (datepicker inputs, form-field popover, color-picker input, avatar
  group), so a component no longer carries another one's CSS.

### Docs

- Config editor: import and export of `ship-config.json`, `ship-styles.json` and `app.config.ts`, an "included styles"
  picker for colours, variants and skins, and validation that drops malformed or outdated settings instead of breaking.
- The Breadcrumbs, Chats, Layouts and Videos pages are in search, and Videos is in the navigation.

## 0.25.8

### Added

- **ship-view-transition**: new `@ship-ui/core/ship-view-transition` entry point for iOS-like page transitions on `router-outlet` via the View Transition API. `withShipViewTransitions()` (router feature) plus `provideShipViewTransitions(config)` set the defaults; the `[shViewTransition]` directive animates an outlet and takes a per-outlet `{ in, out, back, duration, easing }` spec so nested outlets can mix and match. Direction is detected (browser back, URL depth, sibling order for tabs) and can be forced per navigation with `info: { shipViewTransition: 'back' | false }` or disabled per route with `data: { shipViewTransition: false }`. Ships `slideFrom*/slideTo*`, `pushBack/pullForward`, `fadeIn/fadeOut`, `scaleIn/scaleOut`, `shrinkBack/growForward` animations and the `shipIosTransitions`, `shipSheetTransitions`, `shipFadeTransitions` presets; `createViewTransition()` makes custom ones. Keyframes are injected lazily on first use and only imported animations end up in the bundle. Snapshots are clipped to the page box (rounded corners included) and to the outlet's parent through nested view transition groups, and reduced motion swaps instantly. `swipeBack` on the outlet adds the iOS edge swipe: dragging from the left edge scrubs a real back navigation, release past halfway to complete or before it to stay, with all other input blocked while the swipe is in flight; `ShipViewTransitions.beginInteractive()` exposes the same scrubber for custom gestures.

- **ship-chart-scales**: new `@ship-ui/core/ship-chart-scales` entry point with pure, dependency-free chart math: `extent`, `linearScale`, `niceStep`, `niceTicks`, `niceDomain`, `linePath` (linear, monotone, step) and `areaPath`. Shared by every Ship chart and usable on its own.
- **ship-chart-sparkline**: new `sh-chart-sparkline`, the first standalone chart: one series, one SVG, no dependency on the rest of Ship. Inputs `data`, `color` (inherits the palette), `curve`, `area`, `dot`, `min`, `max`, `ariaLabel`, plus `animate` / `animationDuration` which tween data changes (a dropped value slides out on the left, an appended one slides in from the right). Every visual is a custom property declared on the host: `--chart-stroke`, `--chart-fill`, `--chart-fill-opacity`, `--chart-stroke-width`, `--chart-dot-size`, `--chart-h`.

### Docs

- New "Sparkline" page under a new Charts section, with a live streaming example.
- New "View Transitions" page under Directives with a routed phone demo (tabs, push/pop detail page, style picker).

## 0.25.7

### Fixed

- **ship-menu**: buttons that belong to components embedded in the `[menu]` content (an `sh-datepicker`, or anything inside an `sh-form-field-popover` such as `sh-datepicker-input` / `sh-daterange-input`) are no longer treated as menu items. They keep their own layout instead of the menu-item styles, are not collected as options, and clicking them no longer refocuses the menu's search input, which previously closed an embedded date range picker after the first date pick. The default `customOptionElementSelectors` is now `button:not(sh-datepicker *, sh-form-field-popover *)` (exported as `MENU_OPTION_SELECTOR`).
- **ship-menu**: the top margin on the first option only applies to direct children of the options list.

### Docs

- New "Menu with Embedded Date Range" example under menus, using signal forms.
