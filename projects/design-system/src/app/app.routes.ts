import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component'),
    children: [
      {
        path: 'colors',
        loadComponent: () => import('./colors/colors.component'),
      },
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography.component'),
      },
      {
        path: 'buttons',
        loadComponent: () => import('./buttons/buttons.component'),
      },
      {
        path: 'chips',
        loadComponent: () => import('./chips/chips.component'),
      },
      {
        path: 'menus',
        loadComponent: () => import('./menus/menus.component'),
      },
      {
        path: 'snackbar',
        loadComponent: () => import('./snackbar/snackbar.component'),
      },
      {
        path: 'expansion-panel',
        loadComponent: () => import('./expansion-panel/expansion-panel.component'),
      },
      {
        path: 'form-fields',
        loadComponent: () => import('./form-fields/form-fields.component'),
      },
    ],
  },
];
