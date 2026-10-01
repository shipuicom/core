import type { MigrationRules } from './types';

// Component structure normalisation. See MIGRATION.md.
const rules: MigrationRules = {
  version: '0.26.0',
  notes: 'Component structure normalisation. See MIGRATION.md.',
  cssVarPrefixes: [
    {
      from: '--breadcrumbs-',
      to: '--crumb-'
    }
  ],
  cssVars: [
    {
      from: '--box-bc',
      to: '--cb-bc',
      requires: 'sh-checkbox'
    },
    {
      from: '--box-bw',
      to: '--cb-bw',
      requires: 'sh-checkbox'
    },
    {
      from: '--miw',
      to: '--select-miw',
      requires: 'sh-select'
    },
    {
      from: '--caret-color',
      to: '--table-caret-c',
      requires: 'sh-table'
    },
    {
      from: '--caret-size',
      to: '--table-caret-si',
      requires: 'sh-table'
    },
    {
      from: '--stepper-progress',
      to: '--step-progress'
    },
    {
      from: '--overlay',
      to: '--po-overlay',
      requires: 'sh-popover'
    }
  ],
  classes: [
    // sh-list-item-swipe action buttons keep `.danger` / `.warning` as aliases of `.error` / `.warn` for one minor.
    {
      from: 'warning',
      to: 'warn',
      on: [
        'sh-form-field',
        'sh-form-field-popover'
      ]
    }
  ],
  selectors: [
    {
      from: 'ship-alert-container',
      to: 'sh-alert-container'
    },
    { from: 'ship-theme-toggle', to: 'sh-theme-toggle' },
    { from: 'ship-tooltip-wrapper', to: 'sh-tooltip-wrapper' }
  ],
  removedInputs: [
    {
      tag: 'sh-card',
      input: 'color'
    },
    {
      tag: 'sh-button-group',
      input: 'color'
    },
    {
      tag: 'sh-table',
      input: 'color'
    },
    {
      tag: 'sh-toggle-card',
      input: 'color'
    },
    {
      tag: 'sh-tabs',
      input: 'variant'
    }
  ],
  // The 0.25.12 layout flags (`$shipPage` …) lived in component stylesheets only and were never configurable,
  // so there is nothing to rename: `$shipLayoutPage` … `$shipLayoutToolbar` are new flags on the styles entry.
  styleWarnings: [
    { pattern: '--card-p(?![a-z0-9-])', message: '--card-p is now --card-py / --card-px' },
    { pattern: '--alert-p(?![a-z0-9-])', message: '--alert-p is now --alert-py / --alert-px' },
    { pattern: '--chat-p(?![a-z0-9-])', message: '--chat-p is now --chat-py / --chat-px' },
    { pattern: '--list-p(?![a-z0-9-])', message: '--list-p is now --list-py / --list-px' },
    { pattern: '--list-item-p(?![a-z0-9-])', message: '--list-item-p is now --list-item-py / --list-item-px' },
    { pattern: '--dialog-p(?![a-z0-9-])', message: '--dialog-p is now --dialog-py / --dialog-px' },
    { pattern: '--editor-p(?![a-z0-9-])', message: '--editor-p is now --editor-py / --editor-px' },
    { pattern: '--crumb-p(?![a-z0-9-])', message: '--crumb-p is now --crumb-py / --crumb-px' },
    { pattern: '--crumb-item-p(?![a-z0-9-])', message: '--crumb-item-p is now --crumb-item-py / --crumb-item-px' },
    { pattern: '--btng-p(?![a-z0-9-])', message: '--btng-p is now --btng-py / --btng-px' },
    { pattern: '--acc-pad(?![a-z0-9-])', message: '--acc-pad is now --acc-py / --acc-px' },
    { pattern: '--table-th-p(?![a-z0-9-])', message: '--table-th-p is now --table-th-py / --table-th-px' },
    { pattern: '--table-td-p(?![a-z0-9-])', message: '--table-td-p is now --table-td-py / --table-td-px' },
    { pattern: '--tv-p(?![a-z0-9-])', message: '--tv-p is now --tv-py / --tv-px' },
    { pattern: '--page-p(?![a-z0-9-])', message: '--page-p is now --page-py / --page-px' },
    { pattern: '--section-p(?![a-z0-9-])', message: '--section-p is now --section-py / --section-px' },
    { pattern: '--setting-p(?![a-z0-9-])', message: '--setting-p is now --setting-py / --setting-px' },
    { pattern: '--stat-p(?![a-z0-9-])', message: '--stat-p is now --stat-py / --stat-px' },
    { pattern: '--trend-p(?![a-z0-9-])', message: '--trend-p is now --trend-py / --trend-px' },
    { pattern: '--goal-p(?![a-z0-9-])', message: '--goal-p is now --goal-py / --goal-px' },
    { pattern: '--ring-p(?![a-z0-9-])', message: '--ring-p is now --ring-py / --ring-px' },
    { pattern: '--ach-p(?![a-z0-9-])', message: '--ach-p is now --ach-py / --ach-px' },
    { pattern: '--empty-p(?![a-z0-9-])', message: '--empty-p is now --empty-py / --empty-px' },
    { pattern: '--toolbar-p(?![a-z0-9-])', message: '--toolbar-p is now --toolbar-py / --toolbar-px' },
    { pattern: '--ff-space(?![a-z0-9-])', message: '--ff-space is now --ff-py / --ff-px' },
    { pattern: '--ff-input-space(?![a-z0-9-])', message: '--ff-input-space is now --ff-input-py / --ff-input-px' },
  ],
  identifiers: [
    { from: 'ShEditorRemoteCursors', to: 'ShipEditorRemoteCursors' },
    { from: 'ShEditorCollabDirective', to: 'ShipEditorCollabDirective' },
    { from: 'ShSpreadsheetRemoteSelections', to: 'ShipSpreadsheetRemoteSelections' },
  ],
  tsWarnings: [
    { pattern: '\\balertVariant\\b', message: 'SHIP_CONFIG.alertVariant is gone: use alert: { variant }' },
    { pattern: '\\bcardType\\b', message: 'SHIP_CONFIG.cardType is gone: use card: { variant }' },
    { pattern: '\\btableType\\b', message: 'SHIP_CONFIG.tableType is gone: use table: { variant }' },
    { pattern: "'event-card'", message: "SHIP_CONFIG['event-card'] is now eventCard" },
    { pattern: '\\bShipAlertModule\\b', message: 'ShipAlertModule is removed: import ShipAlert / ShipAlertContainer directly' },
    { pattern: 'sh-form-field-experimental|\\bShipFormFieldExperimental\\b', message: 'the sh-form-field-experimental entry point is deleted: use sh-form-field' },
  ],
};

export default rules;
