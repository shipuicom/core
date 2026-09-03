import { Route, Routes } from '@angular/router';

const fallbackOverview: Route = {
  path: '**',
  redirectTo: '',
  pathMatch: 'full',
};

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
        path: 'theme-toggle',
        loadComponent: () => import('./ship/theme-toggle/theme-toggle'),
        children: [
          { path: '', loadComponent: () => import('./ship/theme-toggle/theme-toggle-overview') },
          { path: 'api', loadComponent: () => import('./ship/theme-toggle/theme-toggle-api') },
          { path: 'service', loadComponent: () => import('./ship/theme-toggle/theme-toggle-service') },
          { path: 'examples', loadComponent: () => import('./ship/theme-toggle/theme-toggle-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'buttons',
        loadComponent: () => import('./ship/buttons/buttons'),
        children: [
          { path: '', loadComponent: () => import('./ship/buttons/buttons-overview') },
          { path: 'api', loadComponent: () => import('./ship/buttons/buttons-api') },
          { path: 'examples', loadComponent: () => import('./ship/buttons/buttons-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'blueprints',
        loadComponent: () => import('./ship/blueprints/blueprints'),
        children: [
          { path: '', loadComponent: () => import('./ship/blueprints/blueprints-overview') },
          { path: 'api', loadComponent: () => import('./ship/blueprints/blueprints-api') },
          { path: 'examples', loadComponent: () => import('./ship/blueprints/blueprints-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'progress-bars',
        loadComponent: () => import('./ship/progress-bars/progress-bars'),
        children: [
          { path: '', loadComponent: () => import('./ship/progress-bars/progress-bars-overview') },
          { path: 'api', loadComponent: () => import('./ship/progress-bars/progress-bars-api') },
          { path: 'examples', loadComponent: () => import('./ship/progress-bars/progress-bars-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'toggles',
        loadComponent: () => import('./ship/toggles/toggles'),
        children: [
          { path: '', loadComponent: () => import('./ship/toggles/toggles-overview') },
          { path: 'api', loadComponent: () => import('./ship/toggles/toggles-api') },
          { path: 'parts', loadComponent: () => import('./ship/toggles/toggles-parts') },
          { path: 'examples', loadComponent: () => import('./ship/toggles/toggles-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'color-pickers',
        loadComponent: () => import('./ship/color-pickers/color-pickers'),
        children: [
          { path: '', loadComponent: () => import('./ship/color-pickers/color-pickers-overview') },
          { path: 'api', loadComponent: () => import('./ship/color-pickers/color-pickers-api') },
          { path: 'examples', loadComponent: () => import('./ship/color-pickers/color-pickers-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'checkboxes',
        loadComponent: () => import('./ship/checkboxes/checkboxes'),
        children: [
          { path: '', loadComponent: () => import('./ship/checkboxes/checkboxes-overview') },
          { path: 'api', loadComponent: () => import('./ship/checkboxes/checkboxes-api') },
          { path: 'examples', loadComponent: () => import('./ship/checkboxes/checkboxes-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'alerts',
        loadComponent: () => import('./ship/alerts/alerts'),
        children: [
          { path: '', loadComponent: () => import('./ship/alerts/alerts-overview') },
          { path: 'api', loadComponent: () => import('./ship/alerts/alerts-api') },
          { path: 'service', loadComponent: () => import('./ship/alerts/alerts-service') },
          { path: 'examples', loadComponent: () => import('./ship/alerts/alerts-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'event-cards',
        loadComponent: () => import('./ship/event-cards/event-cards'),
        children: [
          { path: '', loadComponent: () => import('./ship/event-cards/event-cards-overview') },
          { path: 'api', loadComponent: () => import('./ship/event-cards/event-cards-api') },
          { path: 'examples', loadComponent: () => import('./ship/event-cards/event-cards-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'sheets',
        loadComponent: () => import('./ship/sheets/sheets'),
        children: [
          { path: '', loadComponent: () => import('./ship/sheets/sheets-overview') },
          { path: 'examples', loadComponent: () => import('./ship/sheets/sheets-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'spinners',
        loadComponent: () => import('./ship/spinners/spinners'),
        children: [
          { path: '', loadComponent: () => import('./ship/spinners/spinners-overview') },
          { path: 'api', loadComponent: () => import('./ship/spinners/spinners-api') },
          { path: 'examples', loadComponent: () => import('./ship/spinners/spinners-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'menus',
        loadComponent: () => import('./ship/menus/menus'),
        children: [
          { path: '', loadComponent: () => import('./ship/menus/menus-overview') },
          { path: 'api', loadComponent: () => import('./ship/menus/menus-api') },
          { path: 'examples', loadComponent: () => import('./ship/menus/menus-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'icons',
        loadComponent: () => import('./ship/icons/icons'),
        children: [
          { path: '', loadComponent: () => import('./ship/icons/icons-overview') },
          { path: 'api', loadComponent: () => import('./ship/icons/icons-api') },
          { path: 'examples', loadComponent: () => import('./ship/icons/icons-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'chips',
        loadComponent: () => import('./ship/chips/chips'),
        children: [
          { path: '', loadComponent: () => import('./ship/chips/chips-overview') },
          { path: 'api', loadComponent: () => import('./ship/chips/chips-api') },
          { path: 'examples', loadComponent: () => import('./ship/chips/chips-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'form-fields',
        loadComponent: () => import('./ship/form-fields/form-fields'),
        children: [
          { path: '', loadComponent: () => import('./ship/form-fields/form-fields-overview') },
          { path: 'api', loadComponent: () => import('./ship/form-fields/form-fields-api') },
          { path: 'examples', loadComponent: () => import('./ship/form-fields/form-fields-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'form-fields-experimental',
        loadComponent: () => import('./ship/form-fields/examples/experimental-form-field/experimental-form-field'),
      },
      {
        path: 'sidenavs',
        loadComponent: () => import('./ship/sidenavs/sidenavs'),
        children: [
          { path: '', loadComponent: () => import('./ship/sidenavs/sidenavs-overview') },
          { path: 'api', loadComponent: () => import('./ship/sidenavs/sidenavs-api') },
          { path: 'examples', loadComponent: () => import('./ship/sidenavs/sidenavs-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'radio-buttons',
        loadComponent: () => import('./ship/radio-buttons/radio-buttons'),
        children: [
          { path: '', loadComponent: () => import('./ship/radio-buttons/radio-buttons-overview') },
          { path: 'api', loadComponent: () => import('./ship/radio-buttons/radio-buttons-api') },
          { path: 'examples', loadComponent: () => import('./ship/radio-buttons/radio-buttons-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'button-groups',
        loadComponent: () => import('./ship/button-groups/button-groups'),
        children: [
          { path: '', loadComponent: () => import('./ship/button-groups/button-groups-overview') },
          { path: 'api', loadComponent: () => import('./ship/button-groups/button-groups-api') },
          { path: 'examples', loadComponent: () => import('./ship/button-groups/button-groups-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'dividers',
        loadComponent: () => import('./ship/dividers/dividers'),
        children: [
          { path: '', loadComponent: () => import('./ship/dividers/dividers-overview') },
          { path: 'api', loadComponent: () => import('./ship/dividers/dividers-api') },
          { path: 'examples', loadComponent: () => import('./ship/dividers/dividers-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'dialogs',
        loadComponent: () => import('./ship/dialogs/dialogs'),
        children: [
          { path: '', loadComponent: () => import('./ship/dialogs/dialogs-overview') },
          { path: 'api', loadComponent: () => import('./ship/dialogs/dialogs-api') },
          { path: 'service', loadComponent: () => import('./ship/dialogs/dialogs-service') },
          { path: 'examples', loadComponent: () => import('./ship/dialogs/dialogs-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'spotlight',
        loadComponent: () => import('./ship/spotlight/spotlight'),
        children: [
          { path: '', loadComponent: () => import('./ship/spotlight/spotlight-overview') },
          { path: 'api', loadComponent: () => import('./ship/spotlight/spotlight-api') },
          { path: 'service', loadComponent: () => import('./ship/spotlight/spotlight-service') },
          { path: 'styling', loadComponent: () => import('./ship/spotlight/spotlight-styling') },
          { path: 'examples', loadComponent: () => import('./ship/spotlight/spotlight-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'popovers',
        loadComponent: () => import('./ship/popovers/popovers'),
        children: [
          { path: '', loadComponent: () => import('./ship/popovers/popovers-overview') },
          { path: 'api', loadComponent: () => import('./ship/popovers/popovers-api') },
          { path: 'examples', loadComponent: () => import('./ship/popovers/popovers-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'tooltips',
        loadComponent: () => import('./ship/tooltips/tooltips'),
        children: [
          { path: '', loadComponent: () => import('./ship/tooltips/tooltips-overview') },
          { path: 'api', loadComponent: () => import('./ship/tooltips/tooltips-api') },
          { path: 'examples', loadComponent: () => import('./ship/tooltips/tooltips-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'tree',
        loadComponent: () => import('./ship/tree/tree'),
        children: [
          { path: '', loadComponent: () => import('./ship/tree/tree-overview') },
          { path: 'api', loadComponent: () => import('./ship/tree/tree-api') },
          { path: 'parts', loadComponent: () => import('./ship/tree/tree-parts') },
          { path: 'styling', loadComponent: () => import('./ship/tree/tree-styling') },
          { path: 'examples', loadComponent: () => import('./ship/tree/tree-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'tables',
        loadComponent: () => import('./ship/tables/tables'),
        children: [
          { path: '', loadComponent: () => import('./ship/tables/tables-markup') },
          { path: 'api', loadComponent: () => import('./ship/tables/tables-api') },
          { path: 'parts', loadComponent: () => import('./ship/tables/tables-parts') },
          { path: 'config', loadComponent: () => import('./ship/tables/tables-config') },
          fallbackOverview,
        ],
      },
      {
        path: 'range-sliders',
        loadComponent: () => import('./ship/range-sliders/range-sliders'),
        children: [
          { path: '', loadComponent: () => import('./ship/range-sliders/range-sliders-overview') },
          { path: 'api', loadComponent: () => import('./ship/range-sliders/range-sliders-api') },
          { path: 'examples', loadComponent: () => import('./ship/range-sliders/range-sliders-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'cards',
        loadComponent: () => import('./ship/cards/cards'),
        children: [
          { path: '', loadComponent: () => import('./ship/cards/cards-overview') },
          { path: 'api', loadComponent: () => import('./ship/cards/cards-api') },
          { path: 'examples', loadComponent: () => import('./ship/cards/cards-examples') },
          fallbackOverview,
        ],
      },
      // tabs and steppers host routed demos inside their Examples tab, so the
      // demo routes nest under the examples child.
      {
        path: 'tabs',
        loadComponent: () => import('./ship/tabs/tabs'),
        children: [
          { path: '', loadComponent: () => import('./ship/tabs/tabs-overview') },
          { path: 'api', loadComponent: () => import('./ship/tabs/tabs-api') },
          {
            path: 'examples',
            loadComponent: () => import('./ship/tabs/tabs-examples'),
            children: [{ path: 'tab/:id', loadComponent: () => import('./ship/tabs/tab/tab') }],
          },
          fallbackOverview,
        ],
      },
      {
        path: 'steppers',
        loadComponent: () => import('./ship/steppers/steppers'),
        children: [
          { path: '', loadComponent: () => import('./ship/steppers/steppers-overview') },
          { path: 'api', loadComponent: () => import('./ship/steppers/steppers-api') },
          {
            path: 'examples',
            loadComponent: () => import('./ship/steppers/steppers-examples'),
            children: [
              { path: 'step-1', loadComponent: () => import('./ship/steppers/step-1.component') },
              { path: 'step-2', loadComponent: () => import('./ship/steppers/step-2.component') },
              { path: 'step-3', loadComponent: () => import('./ship/steppers/step-3.component') },
              { path: 'step-4', loadComponent: () => import('./ship/steppers/step-4.component') },
              { path: 'step-5', loadComponent: () => import('./ship/steppers/step-5.component') },
            ],
          },
          fallbackOverview,
        ],
      },
      {
        path: 'file-uploads',
        loadComponent: () => import('./ship/file-uploads/file-uploads'),
        children: [
          { path: '', loadComponent: () => import('./ship/file-uploads/file-uploads-overview') },
          { path: 'api', loadComponent: () => import('./ship/file-uploads/file-uploads-api') },
          { path: 'parts', loadComponent: () => import('./ship/file-uploads/file-uploads-parts') },
          { path: 'examples', loadComponent: () => import('./ship/file-uploads/file-uploads-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'sortables',
        loadComponent: () => import('./ship/sortables/sortables'),
        children: [
          { path: '', loadComponent: () => import('./ship/sortables/sortables-overview') },
          { path: 'api', loadComponent: () => import('./ship/sortables/sortables-api') },
          { path: 'service', loadComponent: () => import('./ship/sortables/sortables-service') },
          { path: 'styling', loadComponent: () => import('./ship/sortables/sortables-styling') },
          { path: 'examples', loadComponent: () => import('./ship/sortables/sortables-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'lists',
        loadComponent: () => import('./ship/lists/lists'),
        children: [
          { path: '', loadComponent: () => import('./ship/lists/lists-overview') },
          { path: 'api', loadComponent: () => import('./ship/lists/lists-api') },
          { path: 'service', loadComponent: () => import('./ship/lists/lists-service') },
          { path: 'parts', loadComponent: () => import('./ship/lists/lists-parts') },
          { path: 'examples', loadComponent: () => import('./ship/lists/lists-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'selects',
        loadComponent: () => import('./ship/selects/selects'),
        children: [
          { path: '', loadComponent: () => import('./ship/selects/selects-overview') },
          { path: 'api', loadComponent: () => import('./ship/selects/selects-api') },
          { path: 'examples', loadComponent: () => import('./ship/selects/selects-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'datepickers',
        loadComponent: () => import('./ship/datepickers/datepickers'),
        children: [
          { path: '', loadComponent: () => import('./ship/datepickers/datepickers-overview') },
          { path: 'api', loadComponent: () => import('./ship/datepickers/datepickers-api') },
          { path: 'service', loadComponent: () => import('./ship/datepickers/datepickers-service') },
          { path: 'examples', loadComponent: () => import('./ship/datepickers/datepickers-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'accordions',
        loadComponent: () => import('./ship/accordions/accordions'),
        children: [
          { path: '', loadComponent: () => import('./ship/accordions/accordions-overview') },
          { path: 'api', loadComponent: () => import('./ship/accordions/accordions-api') },
          { path: 'examples', loadComponent: () => import('./ship/accordions/accordions-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'input-mask',
        loadComponent: () => import('./ship/input-mask/input-mask'),
        children: [
          { path: '', loadComponent: () => import('./ship/input-mask/input-mask-overview') },
          { path: 'api', loadComponent: () => import('./ship/input-mask/input-mask-api') },
          { path: 'examples', loadComponent: () => import('./ship/input-mask/input-mask-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'a11y-keybindings',
        loadComponent: () => import('./ship/a11y-keybindings/a11y-keybindings'),
        children: [
          { path: '', loadComponent: () => import('./ship/a11y-keybindings/a11y-keybindings-overview') },
          { path: 'api', loadComponent: () => import('./ship/a11y-keybindings/a11y-keybindings-api') },
          { path: 'service', loadComponent: () => import('./ship/a11y-keybindings/a11y-keybindings-service') },
          { path: 'examples', loadComponent: () => import('./ship/a11y-keybindings/a11y-keybindings-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'virtual-scrolls',
        loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls'),
        children: [
          { path: '', loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls-overview') },
          { path: 'api', loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls-api') },
          { path: 'architecture', loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls-architecture') },
          { path: 'examples', loadComponent: () => import('./ship/virtual-scrolls/virtual-scrolls-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'kbds',
        loadComponent: () => import('./ship/kbds/kbds'),
        children: [
          { path: '', loadComponent: () => import('./ship/kbds/kbds-overview') },
          { path: 'api', loadComponent: () => import('./ship/kbds/kbds-api') },
          { path: 'examples', loadComponent: () => import('./ship/kbds/kbds-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'screenreaders',
        loadComponent: () => import('./ship/screenreaders/screenreaders'),
        children: [
          { path: '', loadComponent: () => import('./ship/screenreaders/screenreaders-overview') },
          { path: 'api', loadComponent: () => import('./ship/screenreaders/screenreaders-api') },
          { path: 'examples', loadComponent: () => import('./ship/screenreaders/screenreaders-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'editors',
        loadComponent: () => import('./ship/editors/editors'),
        children: [
          { path: '', loadComponent: () => import('./ship/editors/editors-overview') },
          { path: 'api', loadComponent: () => import('./ship/editors/editors-api') },
          { path: 'parts', loadComponent: () => import('./ship/editors/editors-parts') },
          { path: 'styling', loadComponent: () => import('./ship/editors/editors-styling') },
          { path: 'examples', loadComponent: () => import('./ship/editors/editors-examples') },
          { path: 'virtual', loadComponent: () => import('./ship/editors/editors-virtual') },
          { path: 'collab', redirectTo: '/editor-collab' },
          fallbackOverview,
        ],
      },
      {
        path: 'editor-collab',
        loadComponent: () => import('./ship/editor-collab/editor-collab'),
        children: [
          { path: '', loadComponent: () => import('./ship/editor-collab/editor-collab-overview') },
          { path: 'transports', loadComponent: () => import('./ship/editor-collab/editor-collab-transports') },
          { path: 'api', loadComponent: () => import('./ship/editor-collab/editor-collab-api') },
          fallbackOverview,
        ],
      },
      {
        path: 'videos',
        loadComponent: () => import('./ship/videos/videos'),
        children: [
          { path: '', loadComponent: () => import('./ship/videos/videos-overview') },
          { path: 'api', loadComponent: () => import('./ship/videos/videos-api') },
          { path: 'service', loadComponent: () => import('./ship/videos/videos-service') },
          { path: 'examples', loadComponent: () => import('./ship/videos/videos-examples') },
          fallbackOverview,
        ],
      },
      {
        path: 'code',
        loadComponent: () => import('./ship/code/code'),
      },
      {
        path: 'spreadsheet',
        loadComponent: () => import('./ship/spreadsheet/spreadsheet'),
      },
    ],
  },
];
