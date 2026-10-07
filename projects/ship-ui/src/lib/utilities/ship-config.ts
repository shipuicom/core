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
  /** Renders the component in a non-interactive read-only state. Read by `shipComponentClasses`. */
  readonly?: boolean;
  /** Sharp (non-rounded) corners, for the components that accept `sharp`. */
  sharp?: boolean;
  /** Read by `shipComponentClasses` for the components that accept `dynamic`. */
  dynamic?: boolean;
  /** Read by `shipComponentClasses` for the components that accept `alwaysShow`. */
  alwaysShow?: boolean;
}

export interface ShipChipConfig extends ShipComponentConfig {
  sharp?: boolean;
  dynamic?: boolean;
}

export interface ShipRangeSliderConfig extends ShipComponentConfig {
  sharp?: boolean;
  alwaysShow?: boolean;
}

export interface ShipIconConfig extends ShipComponentConfig {
  disableUnfocus?: boolean;
}

export interface ShipConfigColors {
  /** Palettes added with `$shipPalettes` are keyed by name too. */
  [palette: string]: string | undefined;
  primary?: string;
  accent?: string;
  warn?: string;
  error?: string;
  success?: string;
  base?: string;
}

export interface ShipConfigDistributions {
  [palette: string]: number | undefined;
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
  /** Base vertical padding in px (`--pad-y`, default 8); every component's padding tier derives from it, rounded to a 2px grid. */
  paddingY?: number;
  /** Base horizontal padding in px (`--pad-x`, default 12). */
  paddingX?: number;
  /** Google Fonts family for `--font-family` (loaded on demand by the host app); unset keeps Inter Tight. */
  fontFamily?: string;
  button?: ShipComponentConfig;
  chip?: ShipChipConfig;
  alert?: ShipComponentConfig;
  progressBar?: ShipComponentConfig;
  spinner?: ShipComponentConfig;
  card?: ShipComponentConfig;
  toggleCard?: ShipComponentConfig;
  table?: ShipComponentConfig;
  buttonGroup?: ShipComponentConfig;
  checkbox?: ShipComponentConfig;
  radio?: ShipComponentConfig;
  toggle?: ShipComponentConfig;
  formField?: ShipComponentConfig;
  icon?: ShipIconConfig;
  stepper?: ShipComponentConfig;
  select?: ShipComponentConfig;
  accordion?: ShipComponentConfig;
  tabs?: ShipComponentConfig;
  eventCard?: ShipComponentConfig;
  datepicker?: ShipComponentConfig;
  rangeSlider?: ShipRangeSliderConfig;
  layoutPage?: ShipComponentConfig;
  layoutSection?: ShipComponentConfig;
  layoutSetting?: ShipComponentConfig;
  layoutEmptyState?: ShipComponentConfig;
  layoutStat?: ShipComponentConfig;
  layoutStatTrend?: ShipComponentConfig;
  layoutStatGoal?: ShipComponentConfig;
  layoutStatRing?: ShipComponentConfig;
  layoutRanking?: ShipComponentConfig;
  layoutAchievement?: ShipComponentConfig;
  layoutInbox?: ShipComponentConfig;
  layoutTableView?: ShipComponentConfig;
  layoutDetails?: ShipComponentConfig;
  layoutTimeline?: ShipComponentConfig;
  layoutToolbar?: ShipComponentConfig;
  breadcrumbs?: ShipComponentConfig;
  chat?: ShipComponentConfig;
  avatar?: ShipComponentConfig;
  chartSparkline?: ShipComponentConfig;
  colorPickerInput?: ShipComponentConfig;
  editor?: ShipComponentConfig;
  themeToggle?: ShipComponentConfig;
  video?: ShipComponentConfig;
  videoPlaylist?: ShipComponentConfig;

  /** Class the dialog service applies to every dialog it opens. */
  dialogType?: 'type-b';
  /** Sidenav mode used by the docs shell. */
  sidenavType?: 'overlay' | 'simple';
}
