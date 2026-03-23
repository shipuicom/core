import { ApplicationConfig, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { SHIP_CONFIG } from 'ship-ui';
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
        const service = inject(AppConfigService);
        return service.reactiveConfig;
      },
      deps: [AppConfigService],
    },
  ],
};
