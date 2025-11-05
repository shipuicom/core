import { InjectionToken } from '@angular/core';

export const SHIP_CONFIG = new InjectionToken<ShipConfig>('Ship UI Config');

export interface ShipConfig {
  alertVariant?: '' | 'simple' | 'outlined' | 'flat' | 'raised';
  cardType?: '' | 'type-b' | 'type-c';
  dialogType?: 'type-b';
  tableType?: 'type-b';
  sidenavType?: 'overlay' | 'simple';
}
