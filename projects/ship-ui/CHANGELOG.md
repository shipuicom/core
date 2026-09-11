# Changelog

## 0.25.7

### Added

- **ship-code-input**: new `sh-code-input` component for one-time / verification codes (auto-advance, backspace, arrows, paste and autofill spreading, `[(value)]`, `(completed)`, projected input for ngModel / reactive / signal forms), the `[shCodeInputGroup]` directive that gives the same behaviour to any set of inputs, and `divider` / `<ng-template shCodeInputDivider>` for dividers between groups.
- **Signal forms**: every form control now documents `[formField]` (`@angular/forms/signals`) support with a "Signal Forms" example — select, range slider, form field, color picker input, checkbox, radio, toggle, datepicker input and input mask. The README has a new Forms section.
- **ship-select**: `ellipsis` host class keeps `asText` multi-select text on one line and truncates it.

### Fixed

- **ship-datepicker**: `sh-datepicker-input` no longer throws when bound with `[formField]` (signal forms register an `NgControl` without `setValue`).
- **nativeInputValueSignal**: programmatic `input.value` writes that land during template rendering (signal forms) no longer throw NG0600, so external model writes reach projected-input components.
- **ship-menu**: buttons that belong to components embedded in the `[menu]` content (an `sh-datepicker`, or anything inside an `sh-form-field-popover` such as `sh-datepicker-input` / `sh-daterange-input`) are no longer treated as menu items. They keep their own layout instead of the menu-item styles, are not collected as options, and clicking them no longer refocuses the menu's search input, which previously closed an embedded date range picker after the first date pick. The default `customOptionElementSelectors` is now `button:not(sh-datepicker *, sh-form-field-popover *)` (exported as `MENU_OPTION_SELECTOR`).
- **ship-menu**: the top margin on the first option only applies to direct children of the options list.

### Docs

- New "Menu with Embedded Date Range" example under menus, using signal forms.
