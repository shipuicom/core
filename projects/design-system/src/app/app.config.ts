import { ApplicationConfig, DOCUMENT, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { SHIP_CONFIG } from '@ship-ui/core';
import { provideShipSpotlight } from '@ship-ui/core/ship-spotlight';
import { environment } from '../environments/environment';
import { ENVIRONMENT_TOKEN } from '../environments/environment-token';
import { routes } from './app.routes';
import { AppConfigService } from './core/services/app-config.service';
import { LOCALSTORAGE } from './core/services/localstorage.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    LOCALSTORAGE,
    // ShipAlertService,

    // { provide: 'Window', useValue: window as any },
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    {
      provide: SHIP_CONFIG,
      useFactory: () => {
        const localStorage = inject(LOCALSTORAGE);
        const document = inject(DOCUMENT);
        const service = inject(AppConfigService);
        return service.reactiveConfig;
      },
      deps: [AppConfigService],
    },
    provideShipSpotlight({
      enableGlobalEventListener: true,
      defaultItems: [
        { id: 'welcome', label: 'Welcome to Ship', category: 'Guide', icon: 'hand-waving', data: { route: '/' } },
        { id: 'getting-started', label: 'Getting Started', category: 'Guide', icon: 'play', data: { route: '/getting-started' } },
        { id: 'typography', label: 'Typography', category: 'Theme', icon: 'text-t', data: { route: '/typography' } },
        { id: 'accordions', label: 'Accordions', category: 'Components', data: { route: '/accordions' } },
        { id: 'alerts', label: 'Alerts', category: 'Components', data: { route: '/alerts' } },
        { id: 'blueprints', label: 'Blueprints', category: 'Components', icon: 'traffic-cone', data: { route: '/blueprints' } },
        { id: 'button-groups', label: 'Button Groups', category: 'Components', data: { route: '/button-groups' } },
        { id: 'buttons', label: 'Buttons', category: 'Components', data: { route: '/buttons' } },
        { id: 'cards', label: 'Cards', category: 'Components', data: { route: '/cards' } },
        { id: 'chips', label: 'Chips', category: 'Components', data: { route: '/chips' } },
        { id: 'color-pickers', label: 'Color Pickers', category: 'Components', data: { route: '/color-pickers' } },
        { id: 'dialogs', label: 'Dialogs', category: 'Components', data: { route: '/dialogs' } },
        { id: 'dividers', label: 'Dividers', category: 'Components', data: { route: '/dividers' } },
        { id: 'event-cards', label: 'Event Cards', category: 'Components', data: { route: '/event-cards' } },
        { id: 'icons', label: 'Icons', category: 'Components', data: { route: '/icons' } },
        { id: 'kbds', label: 'Keyboard Keys', category: 'Components', data: { route: '/kbds' } },
        { id: 'lists', label: 'Lists', category: 'Components', data: { route: '/lists' } },
        { id: 'menus', label: 'Menus', category: 'Components', data: { route: '/menus' } },
        { id: 'popovers', label: 'Popovers', category: 'Components', data: { route: '/popovers' } },
        { id: 'progress-bars', label: 'Progress Bars', category: 'Components', data: { route: '/progress-bars' } },
        { id: 'sheets', label: 'Sheets', category: 'Components', data: { route: '/sheets' } },
        { id: 'sidenavs', label: 'Sidenavs', category: 'Components', data: { route: '/sidenavs' } },
        { id: 'sortables', label: 'Sortables', category: 'Components', data: { route: '/sortables' } },
        { id: 'spinners', label: 'Spinners', category: 'Components', data: { route: '/spinners' } },
        { id: 'spotlight', label: 'Spotlight Search', category: 'Components', data: { route: '/spotlight' } },
        { id: 'steppers', label: 'Steppers', category: 'Components', data: { route: '/steppers' } },
        { id: 'tables', label: 'Tables', category: 'Components', data: { route: '/tables' } },
        { id: 'tabs', label: 'Tabs', category: 'Components', data: { route: '/tabs' } },
        { id: 'tooltips', label: 'Tooltips', category: 'Components', data: { route: '/tooltips' } },
        { id: 'tree', label: 'Tree', category: 'Components', data: { route: '/tree' } },
        { id: 'checkboxes', label: 'Checkboxes', category: 'Form Fields', data: { route: '/checkboxes' } },
        { id: 'datepickers', label: 'Datepickers', category: 'Form Fields', data: { route: '/datepickers' } },
        { id: 'file-uploads', label: 'File Uploads', category: 'Form Fields', data: { route: '/file-uploads' } },
        { id: 'form-fields', label: 'Form Fields', category: 'Form Fields', data: { route: '/form-fields' } },
        { id: 'radio-buttons', label: 'Radio Buttons', category: 'Form Fields', data: { route: '/radio-buttons' } },
        { id: 'range-sliders', label: 'Range Sliders', category: 'Form Fields', data: { route: '/range-sliders' } },
        { id: 'selects', label: 'Selects', category: 'Form Fields', data: { route: '/selects' } },
        { id: 'toggles', label: 'Toggles', category: 'Form Fields', data: { route: '/toggles' } },
        { id: 'input-mask', label: 'Input Mask', category: 'Directives', data: { route: '/input-mask' } },
      ],
    }),
  ],
};
