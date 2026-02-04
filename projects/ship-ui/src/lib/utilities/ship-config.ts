import { InjectionToken } from '@angular/core';
import { ShipColor, ShipSize, ShipVariant } from './ship-types';

export const SHIP_CONFIG = new InjectionToken<ShipConfig>('Ship UI Config');

export interface ShipComponentConfig {
  variant?: ShipVariant | string;
  size?: ShipSize | string;
  color?: ShipColor | string;
}

export interface ShipChipConfig extends ShipComponentConfig {
  sharp?: boolean;
  dynamic?: boolean;
}

export interface ShipConfig {
  button?: ShipComponentConfig;
  chip?: ShipChipConfig;
  alert?: ShipComponentConfig;
  progressBar?: ShipComponentConfig;
  spinner?: ShipComponentConfig;
  card?: ShipComponentConfig;
  table?: ShipComponentConfig;
  buttonGroup?: ShipComponentConfig;
  checkbox?: ShipComponentConfig;
  radio?: ShipComponentConfig;
  toggle?: ShipComponentConfig;
  formField?: ShipComponentConfig;
  icon?: ShipComponentConfig;
  stepper?: ShipComponentConfig;
  select?: ShipComponentConfig;

  // Existing properties for backward compatibility
  alertVariant?: '' | 'simple' | 'outlined' | 'flat' | 'raised';
  cardType?: '' | 'type-b' | 'type-c';
  dialogType?: 'type-b';
  tableType?: 'type-b';
  sidenavType?: 'overlay' | 'simple';
}
