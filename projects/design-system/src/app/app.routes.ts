import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component'),
    children: [
      {
        path: 'colors',
        loadComponent: () => import('./material/colors/colors.component'),
      },
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography.component'),
      },
      {
        path: 'buttons',
        loadComponent: () => import('./material/buttons/buttons.component'),
      },
      {
        path: 'chips',
        loadComponent: () => import('./material/chips/chips.component'),
      },
      {
        path: 'loaders',
        loadComponent: () => import('./material/loaders/loaders.component'),
      },
      {
        path: 'menus',
        loadComponent: () => import('./material/menus/menus.component'),
      },
      {
        path: 'expansion-panel',
        loadComponent: () => import('./material/expansion-panel/expansion-panel.component'),
      },
      {
        path: 'form-fields',
        loadComponent: () => import('./material/form-fields/form-fields.component'),
      },

      {
        path: 'spk-buttons',
        loadComponent: () => import('./sparkle/spk-buttons/spk-buttons.component'),
      },
      {
        path: 'spk-loaders',
        loadComponent: () => import('./sparkle/spk-loaders/spk-loaders.component'),
      },
      {
        path: 'spk-toggle',
        loadComponent: () => import('./sparkle/spk-toggle/spk-toggle.component'),
      },
      {
        path: 'spk-checkbox',
        loadComponent: () => import('./sparkle/spk-checkbox/spk-checkbox.component'),
      },
      {
        path: 'spk-alerts',
        loadComponent: () => import('./sparkle/spk-alerts/spk-alerts.component'),
      },
      {
        path: 'spk-menu',
        loadComponent: () => import('./sparkle/spk-menu/spk-menu.component'),
      },
      {
        path: 'spk-chips',
        loadComponent: () => import('./sparkle/spk-chips/spk-chips.component'),
      },
      {
        path: 'spk-form-fields',
        loadComponent: () => import('./sparkle/spk-form-fields/spk-form-fields.component'),
      },
      {
        path: 'spk-sidenav',
        loadComponent: () => import('./sparkle/spk-sidenav/spk-sidenav.component'),
      },
      {
        path: 'spk-radio',
        loadComponent: () => import('./sparkle/spk-radio/spk-radio.component'),
      },
      {
        path: 'spk-button-group',
        loadComponent: () => import('./sparkle/spk-button-group/spk-button-group.component'),
      },
      {
        path: 'spk-divider',
        loadComponent: () => import('./sparkle/spk-divider/spk-divider.component'),
      },
      {
        path: 'spk-icon',
        loadComponent: () => import('./sparkle/spk-icon/spk-icon.component'),
      },
      {
        path: 'spk-tooltip',
        loadComponent: () => import('./sparkle/spk-tooltip/spk-tooltip.component'),
      },
      {
        path: 'spk-table',
        loadComponent: () => import('./sparkle/spk-table/spk-table.component'),
      },
      {
        path: 'spk-range-slider',
        loadComponent: () => import('./sparkle/spk-range-slider/spk-range-slider.component'),
      },
      {
        path: 'spk-card',
        loadComponent: () => import('./sparkle/spk-card/spk-card.component'),
      },
      {
        path: 'spk-badge',
        loadComponent: () => import('./sparkle/spk-badge/spk-badge.component'),
      },
      {
        path: 'spk-autocomplete',
        loadComponent: () => import('./sparkle/spk-autocomplete/spk-autocomplete.component'),
      },
      {
        path: 'spk-tabs',
        loadComponent: () => import('./sparkle/spk-tabs/spk-tabs.component'),
      },
      {
        path: 'spk-dialog',
        loadComponent: () => import('./sparkle/spk-dialog/spk-dialog.component'),
      },
      {
        path: 'spk-list',
        loadComponent: () => import('./sparkle/spk-list/spk-list.component'),
      },
      {
        path: 'spk-select',
        loadComponent: () => import('./sparkle/spk-select/spk-select.component'),
      },
      {
        path: 'spk-datepicker',
        loadComponent: () => import('./sparkle/spk-datepicker/spk-datepicker.component'),
      },
      {
        path: 'spk-expansion-panel',
        loadComponent: () => import('./sparkle/spk-expansion-panel/spk-expansion-panel.component'),
      },
    ],
  },
];
