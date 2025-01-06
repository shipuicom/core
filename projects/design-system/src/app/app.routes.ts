import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component'),
    children: [
      {
        path: '',
        redirectTo: 'spk-tabs',
        pathMatch: 'full',
      },

      {
        path: 'spk-buttons',
        loadComponent: () => import('./sparkle/spk-buttons/spk-buttons.component'),
      },
      {
        path: 'spk-progress-bar',
        loadComponent: () => import('./sparkle/spk-progress-bar/spk-progress-bar.component'),
      },
      {
        path: 'spk-toggle',
        loadComponent: () => import('./sparkle/spk-toggle/spk-toggle.component'),
      },
      {
        path: 'spk-color-picker',
        loadComponent: () => import('./sparkle/spk-color-picker/spk-color-picker.component'),
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
        path: 'spk-dialog',
        loadComponent: () => import('./sparkle/spk-dialog/spk-dialog.component'),
      },
      {
        path: 'spk-popover',
        loadComponent: () => import('./sparkle/spk-popover/spk-popover.component'),
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
        path: 'spk-tabs',
        loadComponent: () => import('./sparkle/spk-tabs/spk-tabs.component'),
        children: [
          {
            path: '',
            redirectTo: 'tab/1',
            pathMatch: 'full',
          },
          {
            path: 'tab/:id',
            loadComponent: () => import('./sparkle/spk-tabs/tab/tab.component'),
          },
        ],
      },
      {
        path: 'spk-stepper',
        loadComponent: () => import('./sparkle/spk-stepper/spk-stepper.component'),
        children: [
          {
            path: '',
            redirectTo: 'step-1',
            pathMatch: 'full',
          },
          {
            path: 'step-1',
            loadComponent: () => import('./sparkle/spk-stepper/step-1.component'),
          },
          {
            path: 'step-2',
            loadComponent: () => import('./sparkle/spk-stepper/step-2.component'),
          },
          {
            path: 'step-3',
            loadComponent: () => import('./sparkle/spk-stepper/step-3.component'),
          },
          {
            path: 'step-4',
            loadComponent: () => import('./sparkle/spk-stepper/step-4.component'),
          },
          {
            path: 'step-5',
            loadComponent: () => import('./sparkle/spk-stepper/step-5.component'),
          },
        ],
      },
      {
        path: 'spk-file-upload',
        loadComponent: () => import('./sparkle/spk-file-upload/spk-file-upload.component'),
      },
      {
        path: 'spk-sortable',
        loadComponent: () => import('./sparkle/spk-sortable/spk-sortable.component'),
      },
      {
        path: 'spk-chips-input',
        loadComponent: () => import('./sparkle/spk-chips-input/spk-chips-input.component'),
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
