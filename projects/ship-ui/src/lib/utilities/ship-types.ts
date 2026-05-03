export const __SHIP_COLORS = ['primary', 'accent', 'warn', 'error', 'success', ''] as const;
export type ShipColor = (typeof __SHIP_COLORS)[number];

export const __SHIP_SIZES = ['small', 'xsmall', ''] as const;
export type ShipSize = (typeof __SHIP_SIZES)[number];

export const __SHIP_BUTTON_SIZES = ['small', 'xsmall', ''] as const;
export type ShipButtonSize = (typeof __SHIP_BUTTON_SIZES)[number];

export const __SHIP_ICON_SIZES = ['small', 'large', ''] as const;
export type ShipIconSize = (typeof __SHIP_ICON_SIZES)[number];

export const __SHIP_SHEET_VARIANTS = ['simple', 'outlined', 'flat', 'raised', ''] as const;
export type ShipSheetVariant = (typeof __SHIP_SHEET_VARIANTS)[number];

export const __SHIP_TYPE_VARIANTS = ['type-a', 'type-b', 'type-c', 'type-d', ''] as const;
export type ShipTypeVariant = (typeof __SHIP_TYPE_VARIANTS)[number];

export const __SHIP_TABLE_VARIANTS = ['type-a', 'type-b', ''] as const;
export type ShipTableVariant = (typeof __SHIP_TABLE_VARIANTS)[number];

export const __SHIP_CARD_VARIANTS = ['type-a', 'type-b', 'type-c', ''] as const;
export type ShipCardVariant = (typeof __SHIP_CARD_VARIANTS)[number];

export const __SHIP_BUTTON_GROUP_VARIANTS = ['type-a', 'type-b', ''] as const;
export type ShipButtonGroupVariant = (typeof __SHIP_BUTTON_GROUP_VARIANTS)[number];

export const __SHIP_FORM_FIELD_VARIANTS = ['base', 'horizontal', 'auto-width', 'autosize', ''] as const;
export type ShipFormFieldVariant = (typeof __SHIP_FORM_FIELD_VARIANTS)[number];

export const __SHIP_RANGE_SLIDER_VARIANTS = ['simple', 'base', 'thick', 'outlined', 'flat', 'raised', ''] as const;
export type ShipRangeSliderVariant = (typeof __SHIP_RANGE_SLIDER_VARIANTS)[number];

export type ShipVariant = ShipSheetVariant | ShipTypeVariant;
