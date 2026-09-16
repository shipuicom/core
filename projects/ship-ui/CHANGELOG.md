# Changelog

## 0.25.8

### Added

- **ship-view-transition**: new `@ship-ui/core/ship-view-transition` entry point for iOS-like page transitions on `router-outlet` via the View Transition API. `withShipViewTransitions()` (router feature) plus `provideShipViewTransitions(config)` set the defaults; the `[shViewTransition]` directive animates an outlet and takes a per-outlet `{ in, out, back, duration, easing }` spec so nested outlets can mix and match. Direction is detected (browser back, URL depth, sibling order for tabs) and can be forced per navigation with `info: { shipViewTransition: 'back' | false }` or disabled per route with `data: { shipViewTransition: false }`. Ships `slideFrom*/slideTo*`, `pushBack/pullForward`, `fadeIn/fadeOut`, `scaleIn/scaleOut`, `shrinkBack/growForward` animations and the `shipIosTransitions`, `shipSheetTransitions`, `shipFadeTransitions` presets; `createViewTransition()` makes custom ones. Keyframes are injected lazily on first use and only imported animations end up in the bundle. Pages are clipped to the outlet's parent through nested view transition groups, and reduced motion swaps instantly.

### Docs

- New "View Transitions" page under Directives with a routed phone demo (tabs, push/pop detail page, style picker).

## 0.25.7

### Fixed

- **ship-menu**: buttons that belong to components embedded in the `[menu]` content (an `sh-datepicker`, or anything inside an `sh-form-field-popover` such as `sh-datepicker-input` / `sh-daterange-input`) are no longer treated as menu items. They keep their own layout instead of the menu-item styles, are not collected as options, and clicking them no longer refocuses the menu's search input, which previously closed an embedded date range picker after the first date pick. The default `customOptionElementSelectors` is now `button:not(sh-datepicker *, sh-form-field-popover *)` (exported as `MENU_OPTION_SELECTOR`).
- **ship-menu**: the top margin on the first option only applies to direct children of the options list.

### Docs

- New "Menu with Embedded Date Range" example under menus, using signal forms.
