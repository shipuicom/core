import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout'),
    children: [
      {
        path: '',
        loadComponent: () => import('./hello/hello'),
      },
      {
        path: 'getting-started',
        loadComponent: () => import('./getting-started/getting-started'),
      },
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography'),
      },
      {
        path: 'theme-editor',
        loadComponent: () => import('./theme-editor/theme-editor'),
      },
      {
        path: 'buttons',
        loadComponent: () => import('./ship/buttons/buttons'),
      },
      {
        path: 'blueprints',
        loadComponent: () => import('./ship/blueprints/blueprints'),
      },
      {
        path: 'progress-bars',
        loadComponent: () => import('./ship/progress-bars/progress-bars'),
      },
      {
        path: 'toggles',
        loadComponent: () => import('./ship/toggles/toggles'),
      },
      {
        path: 'color-pickers',
        loadComponent: () => import('./ship/color-pickers/color-pickers'),
      },
      {
        path: 'checkboxes',
        loadComponent: () => import('./ship/checkboxes/checkboxes'),
      },
      {
        path: 'alerts',
        loadComponent: () => import('./ship/alerts/alerts'),
      },
      {
        path: 'event-cards',
        loadComponent: () => import('./ship/event-cards/event-cards'),
      },
      {
        path: 'sheets',
        loadComponent: () => import('./ship/sheets/sheets'),
      },
      {
        path: 'spinners',
        loadComponent: () => import('./ship/spinners/spinners'),
      },
      {
        path: 'menus',
        loadComponent: () => import('./ship/menus/menus'),
      },
      {
        path: 'icons',
        loadComponent: () => import('./ship/icons/icons'),
      },
      {
        path: 'chips',
        loadComponent: () => import('./ship/chips/chips'),
      },
      {
        path: 'form-fields',
        loadComponent: () => import('./ship/form-fields/form-fields'),
      },
      {
        path: 'form-fields-experimental',
        loadComponent: () => import('./ship/form-fields/examples/experimental-form-field/experimental-form-field'),
      },
      {
        path: 'sidenavs',
        loadComponent: () => import('./ship/sidenavs/sidenavs'),
      },
      {
        path: 'radio-buttons',
        loadComponent: () => import('./ship/radio-buttons/radio-buttons'),
      },
      {
        path: 'button-groups',
        loadComponent: () => import('./ship/button-groups/button-groups'),
      },
      {
        path: 'dividers',
        loadComponent: () => import('./ship/dividers/dividers'),
      },
      {
        path: 'dialogs',
        loadComponent: () => import('./ship/dialogs/dialogs'),
      },
      {
        path: 'popovers',
        loadComponent: () => import('./ship/popovers/popovers'),
      },
      {
        path: 'tooltips',
        loadComponent: () => import('./ship/tooltips/tooltips'),
      },
      {
        path: 'tables',
        loadComponent: () => import('./ship/tables/tables'),
      },
      {
        path: 'range-sliders',
        loadComponent: () => import('./ship/range-sliders/range-sliders'),
      },
      {
        path: 'cards',
        loadComponent: () => import('./ship/cards/cards'),
      },
      {
        path: 'tabs',
        loadComponent: () => import('./ship/tabs/tabs'),
        children: [
          {
            path: '',
            redirectTo: 'tab/1',
            pathMatch: 'full',
          },
          {
            path: 'tab/:id',
            loadComponent: () => import('./ship/tabs/tab/tab'),
          },
        ],
      },
      {
        path: 'steppers',
        loadComponent: () => import('./ship/steppers/steppers'),
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
        loadComponent: () => import('./ship/file-uploads/file-uploads'),
      },
      {
        path: 'sortables',
        loadComponent: () => import('./ship/sortables/sortables'),
      },
      {
        path: 'lists',
        loadComponent: () => import('./ship/lists/lists'),
      },
      {
        path: 'selects',
        loadComponent: () => import('./ship/selects/selects'),
      },
      {
        path: 'datepickers',
        loadComponent: () => import('./ship/datepickers/datepickers'),
      },
      {
        path: 'expansion-panels',
        loadComponent: () => import('./ship/expansion-panels/expansion-panels'),
      },
      {
        path: 'input-mask',
        loadComponent: () => import('./ship/input-mask/input-mask'),
      },
      {
        path: 'virtual-scrolls',
        loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls'),
      },
    ],
  },
];
