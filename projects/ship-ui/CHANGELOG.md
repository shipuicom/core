# Changelog

## 0.25.7

### Fixed

- **ship-menu**: buttons that belong to components embedded in the `[menu]` content (an `sh-datepicker`, or anything inside an `sh-form-field-popover` such as `sh-datepicker-input` / `sh-daterange-input`) are no longer treated as menu items. They keep their own layout instead of the menu-item styles, are not collected as options, and clicking them no longer refocuses the menu's search input, which previously closed an embedded date range picker after the first date pick. The default `customOptionElementSelectors` is now `button:not(sh-datepicker *, sh-form-field-popover *)` (exported as `MENU_OPTION_SELECTOR`).
- **ship-menu**: the top margin on the first option only applies to direct children of the options list.

### Docs

- New "Menu with Embedded Date Range" example under menus, using signal forms.
