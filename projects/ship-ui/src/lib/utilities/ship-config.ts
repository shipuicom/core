import { InjectionToken } from '@angular/core';
import { ShipColor, ShipSize, ShipVariant } from './ship-types';

export const defaultThemeColors: Record<string, string> = {
  primary: 'hsl(217, 91%, 60%)',
  accent: 'hsl(258, 90%, 66%)',
  warn: 'hsl(37, 92%, 50%)',
  error: 'hsl(0, 84%, 60%)',
  success: 'hsl(159, 84%, 39%)',
  base: 'hsl(0, 0%, 46%)'
};

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

export interface ShipRangeSliderConfig extends ShipComponentConfig {
  sharp?: boolean;
  alwaysShow?: boolean;
}

export interface ShipConfigColors {
  primary?: string;
  accent?: string;
  warn?: string;
  error?: string;
  success?: string;
  base?: string;
}

export interface ShipConfigDistributions {
  primary?: number;
  accent?: number;
  warn?: number;
  error?: number;
  success?: number;
  base?: number;
}

export interface ShipConfig {
  fontSize?: number;
  colors?: ShipConfigColors;
  distribution?: ShipConfigDistributions;
  borderRadius?: number;
  borderWidth?: number;
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
  accordion?: ShipComponentConfig;
  tabs?: ShipComponentConfig;
  'event-card'?: ShipComponentConfig;
  datepicker?: ShipComponentConfig;
  rangeSlider?: ShipRangeSliderConfig;

  // Existing properties for backward compatibility
  alertVariant?: '' | 'simple' | 'outlined' | 'flat' | 'raised';
  cardType?: '' | 'type-b' | 'type-c';
  dialogType?: 'type-b';
  tableType?: 'type-b';
  sidenavType?: 'overlay' | 'simple';
}
