export type ComponentType =
  | 'selection-group'
  | 'details-summary'
  | 'input-control'
  | 'combobox-listbox'
  | 'datepicker'
  | 'popover'
  | 'dialog'
  | 'progressbar'
  | 'tree'
  | 'tooltip'
  | 'table'
  | 'alert'
  | 'status'
  | 'separator'
  | 'list'
  | 'navigation'
  | 'button'
  | 'chip'
  | 'colorpicker'
  | 'fileupload'
  | 'editor'
  | 'card'
  | 'icon'
  | 'blueprint'
  | 'event-card'
  | 'form-field'
  | 'sortable'
  | 'input-mask'
  | 'keybinding'
  | 'virtual-scroll'
  | 'kbd'
  | 'theme-toggle'
  | 'toggle-card';

export interface AriaRules {
  selector: string;
  type: ComponentType;
  hostRole?: string;
  itemSelector?: string;
  itemRole?: string;
  activeAttr?: 'aria-selected' | 'aria-pressed' | 'aria-checked';
  hasNativeInput?: 'checkbox' | 'radio' | 'range';
}

export const COMPONENT_A11Y_MAP: Record<string, { url: string; rules: AriaRules[] }> = {
  'button-group': {
    url: 'http://localhost:4205/button-groups',
    rules: [
      {
        selector: 'sh-button-group',
        type: 'selection-group',
        hostRole: 'group',
        itemSelector: 'button',
        activeAttr: 'aria-pressed',
      }
    ]
  },
  'tabs': {
    url: 'http://localhost:4205/tabs',
    rules: [
      {
        selector: 'sh-tabs',
        type: 'selection-group',
        hostRole: 'tablist',
        itemSelector: '[value], [tab], button, a',
        itemRole: 'tab',
        activeAttr: 'aria-selected',
      }
    ]
  },
  'stepper': {
    url: 'http://localhost:4205/steppers',
    rules: [
      {
        selector: 'sh-stepper',
        type: 'selection-group',
        hostRole: 'tablist',
        itemSelector: '[value], [step], [routerLinkActive], button, a',
        itemRole: 'tab',
        activeAttr: 'aria-selected',
      }
    ]
  },
  'accordion': {
    url: 'http://localhost:4205/accordions',
    rules: [
      {
        selector: 'sh-accordion',
        type: 'details-summary',
      }
    ]
  },
  'checkbox': {
    url: 'http://localhost:4205/checkboxes',
    rules: [
      {
        selector: 'sh-checkbox',
        type: 'input-control',
        hasNativeInput: 'checkbox',
      }
    ]
  },
  'toggle': {
    url: 'http://localhost:4205/toggles',
    rules: [
      {
        selector: 'sh-toggle',
        type: 'input-control',
        hasNativeInput: 'checkbox',
      }
    ]
  },
  'radio-buttons': {
    url: 'http://localhost:4205/radio-buttons',
    rules: [
      {
        selector: 'sh-radio',
        type: 'input-control',
        hasNativeInput: 'radio',
      }
    ]
  },
  'menus': {
    url: 'http://localhost:4205/menus',
    rules: [
      {
        selector: 'sh-menu',
        type: 'combobox-listbox',
      }
    ]
  },
  'selects': {
    url: 'http://localhost:4205/selects',
    rules: [
      {
        selector: 'sh-select',
        type: 'combobox-listbox',
      }
    ]
  },
  'datepickers': {
    url: 'http://localhost:4205/datepickers',
    rules: [
      {
        selector: 'sh-datepicker',
        type: 'datepicker',
      }
    ]
  },
  'popovers': {
    url: 'http://localhost:4205/popovers',
    rules: [
      {
        selector: 'sh-popover',
        type: 'popover',
      }
    ]
  },
  'dialogs': {
    url: 'http://localhost:4205/dialogs',
    rules: [
      {
        selector: 'sh-dialog',
        type: 'dialog',
      }
    ]
  },
  'progress-bars': {
    url: 'http://localhost:4205/progress-bars',
    rules: [
      {
        selector: 'sh-progress-bar',
        type: 'progressbar',
      }
    ]
  },
  'range-sliders': {
    url: 'http://localhost:4205/range-sliders',
    rules: [
      {
        selector: 'sh-range-slider',
        type: 'input-control',
        hasNativeInput: 'range',
      }
    ]
  },
  'tree': {
    url: 'http://localhost:4205/tree',
    rules: [
      {
        selector: 'sh-tree',
        type: 'tree',
      }
    ]
  },
  'tooltips': {
    url: 'http://localhost:4205/tooltips',
    rules: [
      {
        selector: '.tooltip',
        type: 'tooltip',
      }
    ]
  },
  'tables': {
    url: 'http://localhost:4205/tables',
    rules: [
      {
        selector: 'sh-table',
        type: 'table',
      }
    ]
  },
  'alerts': {
    url: 'http://localhost:4205/alerts',
    rules: [
      {
        selector: 'sh-alert',
        type: 'alert',
      }
    ]
  },
  'spinners': {
    url: 'http://localhost:4205/spinners',
    rules: [
      {
        selector: 'sh-spinner',
        type: 'status',
      }
    ]
  },
  'dividers': {
    url: 'http://localhost:4205/dividers',
    rules: [
      {
        selector: 'sh-divider',
        type: 'separator',
      }
    ]
  },
  'lists': {
    url: 'http://localhost:4205/lists',
    rules: [
      {
        selector: 'sh-list',
        type: 'list',
      }
    ]
  },
  'sidenavs': {
    url: 'http://localhost:4205/sidenavs',
    rules: [
      {
        selector: 'sh-sidenav',
        type: 'navigation',
      }
    ]
  },
  'buttons': {
    url: 'http://localhost:4205/buttons',
    rules: [
      {
        selector: '[shButton]',
        type: 'button',
      }
    ]
  },
  'chips': {
    url: 'http://localhost:4205/chips',
    rules: [
      {
        selector: 'sh-chip',
        type: 'chip',
      }
    ]
  },
  'color-pickers': {
    url: 'http://localhost:4205/color-pickers',
    rules: [
      {
        selector: 'sh-color-picker',
        type: 'colorpicker',
      }
    ]
  },
  'file-uploads': {
    url: 'http://localhost:4205/file-uploads',
    rules: [
      {
        selector: 'sh-file-upload',
        type: 'fileupload',
      }
    ]
  },
  'editors': {
    url: 'http://localhost:4205/editors',
    rules: [
      {
        selector: 'sh-editor',
        type: 'editor',
      }
    ]
  },
  'cards': {
    url: 'http://localhost:4205/cards',
    rules: [
      {
        selector: 'sh-card',
        type: 'card',
      },
      {
        selector: 'sh-toggle-card',
        type: 'toggle-card',
      }
    ]
  },
  'spotlight': {
    url: 'http://localhost:4205/spotlight',
    rules: [
      {
        selector: 'sh-dialog, sh-dialog-ref',
        type: 'dialog',
      }
    ]
  },
  'icons': {
    url: 'http://localhost:4205/icons',
    rules: [
      {
        selector: 'sh-icon',
        type: 'icon',
      }
    ]
  },
  'blueprints': {
    url: 'http://localhost:4205/blueprints',
    rules: [
      {
        selector: 'sh-blueprint',
        type: 'blueprint',
      }
    ]
  },
  'event-cards': {
    url: 'http://localhost:4205/event-cards',
    rules: [
      {
        selector: 'sh-event-card',
        type: 'event-card',
      }
    ]
  },
  'sheets': {
    url: 'http://localhost:4205/sheets',
    rules: [
      {
        selector: '.sh-sheet',
        type: 'card',
      }
    ]
  },
  'form-fields': {
    url: 'http://localhost:4205/form-fields',
    rules: [
      {
        selector: 'sh-form-field',
        type: 'form-field',
      }
    ]
  },
  'form-fields-experimental': {
    url: 'http://localhost:4205/form-fields-experimental',
    rules: [
      {
        selector: 'sh-form-field-experimental',
        type: 'form-field',
      }
    ]
  },
  'sortables': {
    url: 'http://localhost:4205/sortables',
    rules: [
      {
        selector: '.sh-sortable',
        type: 'sortable',
      }
    ]
  },
  'input-mask': {
    url: 'http://localhost:4205/input-mask',
    rules: [
      {
        selector: '[shinputmask]',
        type: 'input-mask',
      }
    ]
  },
  'a11y-keybindings': {
    url: 'http://localhost:4205/a11y-keybindings',
    rules: [
      {
        selector: '[aria-keyshortcuts]',
        type: 'keybinding',
      }
    ]
  },
  'virtual-scrolls': {
    url: 'http://localhost:4205/virtual-scrolls',
    rules: [
      {
        selector: 'sh-virtual-scroll',
        type: 'virtual-scroll',
      }
    ]
  },
  'kbds': {
    url: 'http://localhost:4205/kbds',
    rules: [
      {
        selector: 'sh-kbd',
        type: 'kbd',
      }
    ]
  },
  'theme-toggle': {
    url: 'http://localhost:4205/getting-started',
    rules: [
      {
        selector: 'ship-theme-toggle',
        type: 'theme-toggle',
      }
    ]
  }
};
