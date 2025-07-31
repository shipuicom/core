import { InjectionToken } from '@angular/core';

export const SHIP_CONFIG = new InjectionToken<ShipConfig>('Ship UI Config');

interface ShipConfig {
  cardType?: 'type-b';
  dialogType?: 'type-b';
  tableType?: 'type-b';
  sidenavType?: 'overlay' | 'simple';
}
