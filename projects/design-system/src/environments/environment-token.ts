import { InjectionToken } from '@angular/core';
import { environment } from './environment';

export const ENVIRONMENT_TOKEN = new InjectionToken<typeof environment>('ENVIRONMENT');
