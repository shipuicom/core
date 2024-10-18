Directives attributes should be using kebab-case

### Updated directives

- spkFileDragDrop -> spkDragDrop
- gridSortable -> spkGridSortable

### Updated attributes

- spk-form-field
  - spkPrefix -> prefix
  - spkTextPrefix -> textPrefix
  - spkSuffix -> suffix
  - spkTextSuffix -> textSuffix
  - spkError -> error
  - spkHint -> hint
- spk-list
  - spk-list-item -> item
  - spk-action-item -> action
- spk-dialog
  - spk-header -> header
  - spk-content -> content
  - spk-footer -> footer
- spk-popover
  - popover-trigger -> trigger
- spk-tabs
  - spk-tab -> tab
- spk-alert
  - alert-icon -> icon
  - alert-title -> title
  - alert-content -> content
- spk-chip
  - spkChipAvatar -> avatar
- spk-range-slider
  - spkLabel -> label
- spk-stepper
  - spk-step -> step

### Removed select annotations

- spk-select
  - `<ng-container options>my options</ng-container>` -> default content projection `my options`
