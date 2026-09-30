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
    {
      from: 'warning',
      to: 'warn',
      on: [
        'sh-form-field',
        'sh-form-field-popover',
        'sh-list-item-swipe'
      ]
    },
    {
      from: 'danger',
      to: 'error',
      on: [
        'sh-list-item-swipe'
      ]
    }
  ],
  selectors: [
    {
      from: 'ship-alert-container',
      to: 'sh-alert-container'
    }
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
  sassFlags: [
    {
      from: '$shipPage',
      to: '$shipLayoutPage'
    },
    {
      from: '$shipSection',
      to: '$shipLayoutSection'
    },
    {
      from: '$shipSetting',
      to: '$shipLayoutSetting'
    },
    {
      from: '$shipEmptyState',
      to: '$shipLayoutEmptyState'
    },
    {
      from: '$shipStat',
      to: '$shipLayoutStat'
    },
    {
      from: '$shipStatTrend',
      to: '$shipLayoutStatTrend'
    },
    {
      from: '$shipStatGoal',
      to: '$shipLayoutStatGoal'
    },
    {
      from: '$shipStatRing',
      to: '$shipLayoutStatRing'
    },
    {
      from: '$shipRanking',
      to: '$shipLayoutRanking'
    },
    {
      from: '$shipAchievement',
      to: '$shipLayoutAchievement'
    },
    {
      from: '$shipInbox',
      to: '$shipLayoutInbox'
    },
    {
      from: '$shipTableView',
      to: '$shipLayoutTableView'
    },
    {
      from: '$shipDetails',
      to: '$shipLayoutDetails'
    },
    {
      from: '$shipTimeline',
      to: '$shipLayoutTimeline'
    },
    {
      from: '$shipToolbar',
      to: '$shipLayoutToolbar'
    }
  ],
  tsWarnings: [
    { pattern: '\\balertVariant\\b', message: 'SHIP_CONFIG.alertVariant is gone: use alert: { variant }' },
    { pattern: '\\bcardType\\b', message: 'SHIP_CONFIG.cardType is gone: use card: { variant }' },
    { pattern: '\\btableType\\b', message: 'SHIP_CONFIG.tableType is gone: use table: { variant }' },
    { pattern: "'event-card'", message: "SHIP_CONFIG['event-card'] is now eventCard" },
  ],
};

export default rules;
