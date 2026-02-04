export type ShipColor = 'primary' | 'accent' | 'warn' | 'error' | 'success' | (string & {});
export type ShipSize = 'small' | (string & {});
export type ShipButtonSize = 'small' | 'xsmall' | (string & {});
export type ShipIconSize = 'small' | 'large' | (string & {});

export type ShipSheetVariant = 'simple' | 'outlined' | 'flat' | 'raised' | (string & {});
export type ShipTypeVariant = 'type-a' | 'type-b' | 'type-c' | 'type-d' | (string & {});

export type ShipTableVariant = 'type-a' | 'type-b' | (string & {});
export type ShipCardVariant = 'type-a' | 'type-b' | 'type-c' | (string & {});
export type ShipButtonGroupVariant = 'type-a' | 'type-b' | (string & {});

export type ShipVariant = ShipSheetVariant | ShipTypeVariant;
