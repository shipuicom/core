import { InjectionToken } from '@angular/core';

export const SPARKLE_CONFIG = new InjectionToken<SparkleConfig>('Sparkle UI Config');

interface SparkleConfig {
  cardType?: 'type-b';
  dialogType?: 'type-b';
  tableType?: 'type-b';
  sidenavType?: 'overlay' | 'simple';
}
