import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component'),
    children: [
      {
        path: '',
        loadComponent: () => import('./hello/hello.component'),
      },
      {
        path: 'getting-started',
        loadComponent: () => import('./getting-started/getting-started.component'),
      },
      {
        path: 'example',
        loadComponent: () => import('../../../ship-ui/src/lib/utilities/create-input-example.component'),
      },
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography.component'),
      },
      {
        path: 'theme-editor',
        loadComponent: () => import('./theme-editor/theme-editor.component'),
      },
      {
        path: 'buttons',
        loadComponent: () => import('./ship/buttons/buttons.component'),
      },
      {
        path: 'progress-bars',
        loadComponent: () => import('./ship/progress-bars/progress-bars.component'),
      },
      {
        path: 'toggles',
        loadComponent: () => import('./ship/toggles/toggles.component'),
      },
      {
        path: 'color-pickers',
        loadComponent: () => import('./ship/color-pickers/color-pickers.component'),
      },
      {
        path: 'checkboxes',
        loadComponent: () => import('./ship/checkboxes/checkboxes.component'),
      },
      {
        path: 'alerts',
        loadComponent: () => import('./ship/alerts/alerts.component'),
      },
      {
        path: 'event-cards',
        loadComponent: () => import('./ship/event-cards/event-cards.component'),
      },
      {
        path: 'sheets',
        loadComponent: () => import('./ship/sheets/sheets.component'),
      },
      {
        path: 'spinners',
        loadComponent: () => import('./ship/spinners/spinners.component'),
      },
      {
        path: 'menus',
        loadComponent: () => import('./ship/menus/menus.component'),
      },
      {
        path: 'icons',
        loadComponent: () => import('./ship/icons/icons.component'),
      },
      {
        path: 'chips',
        loadComponent: () => import('./ship/chips/chips.component'),
      },
      {
        path: 'form-fields',
        loadComponent: () => import('./ship/form-fields/form-fields.component'),
      },
      {
        path: 'sidenavs',
        loadComponent: () => import('./ship/sidenavs/sidenavs.component'),
      },
      {
        path: 'radio-buttons',
        loadComponent: () => import('./ship/radio-buttons/radio-buttons.component'),
      },
      {
        path: 'button-groups',
        loadComponent: () => import('./ship/button-groups/button-groups.component'),
      },
      {
        path: 'dividers',
        loadComponent: () => import('./ship/dividers/dividers.component'),
      },
      {
        path: 'dialogs',
        loadComponent: () => import('./ship/dialogs/dialogs.component'),
      },
      {
        path: 'popovers',
        loadComponent: () => import('./ship/popovers/popovers.component'),
      },
      {
        path: 'tooltips',
        loadComponent: () => import('./ship/tooltips/tooltips.component'),
      },
      {
        path: 'tables',
        loadComponent: () => import('./ship/tables/tables.component'),
      },
      {
        path: 'range-sliders',
        loadComponent: () => import('./ship/range-sliders/range-sliders.component'),
      },
      {
        path: 'cards',
        loadComponent: () => import('./ship/cards/cards.component'),
      },
      {
        path: 'tabs',
        loadComponent: () => import('./ship/tabs/tabs.component'),
        children: [
          {
            path: '',
            redirectTo: 'tab/1',
            pathMatch: 'full',
          },
          {
            path: 'tab/:id',
            loadComponent: () => import('./ship/tabs/tab/tab.component'),
          },
        ],
      },
      {
        path: 'steppers',
        loadComponent: () => import('./ship/steppers/steppers.component'),
        children: [
          {
            path: '',
            redirectTo: 'step-1',
            pathMatch: 'full',
          },
          {
            path: 'step-1',
            loadComponent: () => import('./ship/steppers/step-1.component'),
          },
          {
            path: 'step-2',
            loadComponent: () => import('./ship/steppers/step-2.component'),
          },
          {
            path: 'step-3',
            loadComponent: () => import('./ship/steppers/step-3.component'),
          },
          {
            path: 'step-4',
            loadComponent: () => import('./ship/steppers/step-4.component'),
          },
          {
            path: 'step-5',
            loadComponent: () => import('./ship/steppers/step-5.component'),
          },
        ],
      },
      {
        path: 'file-uploads',
        loadComponent: () => import('./ship/file-uploads/file-uploads.component'),
      },
      {
        path: 'sortables',
        loadComponent: () => import('./ship/sortables/sortables.component'),
      },
      {
        path: 'chip-inputs',
        loadComponent: () => import('./ship/chip-inputs/chip-inputs.component'),
      },
      {
        path: 'lists',
        loadComponent: () => import('./ship/lists/lists.component'),
      },
      {
        path: 'selects',
        loadComponent: () => import('./ship/selects/selects.component'),
      },
      {
        path: 'datepickers',
        loadComponent: () => import('./ship/datepickers/datepickers.component'),
      },
      {
        path: 'expansion-panels',
        loadComponent: () => import('./ship/expansion-panels/expansion-panels.component'),
      },
      {
        path: 'virtual-scrolls',
        loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls.component'),
      },
    ],
  },
];
