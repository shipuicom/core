import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SPARKLE_CONFIG } from '../../../sparkle-ui/src/public-api';
import { environment } from '../environments/environment';
import { ENVIRONMENT_TOKEN } from '../environments/environment-token';
import { routes } from './app.routes';
import { LOCALSTORAGE } from './core/services/localstorage.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    LOCALSTORAGE,
    // SparkleAlertService,

    // { provide: 'Window', useValue: window as any },
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    {
      provide: SPARKLE_CONFIG,
      useValue: {
        // dialogType: 'type-b',
        // tableType: 'type-b',
        sidenavType: 'overlay',
      },
    },
  ],
};
