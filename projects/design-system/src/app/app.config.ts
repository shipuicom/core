import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { MAT_DRAWER_DEFAULT_AUTOSIZE } from '@angular/material/sidenav';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from '../environments/environment';
import { ENVIRONMENT_TOKEN } from '../environments/environment-token';
import { routes } from './app.routes';
import { LOCALSTORAGE } from './core/services/localstorage.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    LOCALSTORAGE,
    // SparkleAlertService,

    { provide: 'Window', useValue: window as any },
    { provide: MAT_DRAWER_DEFAULT_AUTOSIZE, useValue: false },
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        subscriptSizing: 'dynamic',
      } as MatFormFieldDefaultOptions,
    },
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: {
        fontSet: 'phb',
      },
    },
  ],
};
