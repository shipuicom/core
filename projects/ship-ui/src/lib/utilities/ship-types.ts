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

export const __SHIP_ACCORDION_VARIANTS = ['type-b', ''] as const;
export type ShipAccordionVariant = (typeof __SHIP_ACCORDION_VARIANTS)[number];

export const __SHIP_TABLE_VARIANTS = ['type-a', 'type-b', ''] as const;
export type ShipTableVariant = (typeof __SHIP_TABLE_VARIANTS)[number];

export const __SHIP_CARD_VARIANTS = ['type-a', 'type-b', 'type-c', 'type-d', ''] as const;
export type ShipCardVariant = (typeof __SHIP_CARD_VARIANTS)[number];

export const __SHIP_TOGGLE_CARD_VARIANTS = ['type-a', 'type-b', 'type-c', 'type-d', ''] as const;
export type ShipToggleCardVariant = (typeof __SHIP_TOGGLE_CARD_VARIANTS)[number];

export const __SHIP_BUTTON_GROUP_VARIANTS = [''] as const;
export type ShipButtonGroupVariant = (typeof __SHIP_BUTTON_GROUP_VARIANTS)[number];

export const __SHIP_FORM_FIELD_VARIANTS = ['base', 'horizontal', 'auto-width', 'autosize', ''] as const;
export type ShipFormFieldVariant = (typeof __SHIP_FORM_FIELD_VARIANTS)[number];

export const __SHIP_RANGE_SLIDER_VARIANTS = ['simple', 'base', 'thick', 'outlined', 'flat', 'raised', ''] as const;
export type ShipRangeSliderVariant = (typeof __SHIP_RANGE_SLIDER_VARIANTS)[number];

export type ShipVariant = ShipSheetVariant | ShipTypeVariant;

export const __SHIP_LAYOUT_PAGE_SIZES = ['small', 'large', ''] as const;
export type ShipLayoutPageSize = (typeof __SHIP_LAYOUT_PAGE_SIZES)[number];

export const __SHIP_LAYOUT_PAGE_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutPageVariant = (typeof __SHIP_LAYOUT_PAGE_VARIANTS)[number];

export const __SHIP_LAYOUT_SECTION_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutSectionVariant = (typeof __SHIP_LAYOUT_SECTION_VARIANTS)[number];

export const __SHIP_LAYOUT_SETTING_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutSettingVariant = (typeof __SHIP_LAYOUT_SETTING_VARIANTS)[number];

export const __SHIP_LAYOUT_EMPTY_STATE_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutEmptyStateVariant = (typeof __SHIP_LAYOUT_EMPTY_STATE_VARIANTS)[number];

export const __SHIP_LAYOUT_STAT_VARIANTS = ['type-b', 'type-c', 'type-d', ''] as const;
export type ShipLayoutStatVariant = (typeof __SHIP_LAYOUT_STAT_VARIANTS)[number];

export const __SHIP_LAYOUT_STAT_TREND_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutStatTrendVariant = (typeof __SHIP_LAYOUT_STAT_TREND_VARIANTS)[number];

export const __SHIP_LAYOUT_STAT_GOAL_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutStatGoalVariant = (typeof __SHIP_LAYOUT_STAT_GOAL_VARIANTS)[number];

export const __SHIP_LAYOUT_STAT_RING_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutStatRingVariant = (typeof __SHIP_LAYOUT_STAT_RING_VARIANTS)[number];

export const __SHIP_LAYOUT_RANKING_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutRankingVariant = (typeof __SHIP_LAYOUT_RANKING_VARIANTS)[number];

export const __SHIP_LAYOUT_ACHIEVEMENT_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutAchievementVariant = (typeof __SHIP_LAYOUT_ACHIEVEMENT_VARIANTS)[number];

export const __SHIP_LAYOUT_INBOX_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutInboxVariant = (typeof __SHIP_LAYOUT_INBOX_VARIANTS)[number];

export const __SHIP_LAYOUT_TABLE_VIEW_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutTableViewVariant = (typeof __SHIP_LAYOUT_TABLE_VIEW_VARIANTS)[number];

export const __SHIP_LAYOUT_DETAILS_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutDetailsVariant = (typeof __SHIP_LAYOUT_DETAILS_VARIANTS)[number];

export const __SHIP_LAYOUT_TIMELINE_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutTimelineVariant = (typeof __SHIP_LAYOUT_TIMELINE_VARIANTS)[number];

export const __SHIP_LAYOUT_TOOLBAR_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipLayoutToolbarVariant = (typeof __SHIP_LAYOUT_TOOLBAR_VARIANTS)[number];

export const __SHIP_BREADCRUMBS_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipBreadcrumbsVariant = (typeof __SHIP_BREADCRUMBS_VARIANTS)[number];

export const __SHIP_BREADCRUMBS_SIZES = ['small', ''] as const;
export type ShipBreadcrumbsSize = (typeof __SHIP_BREADCRUMBS_SIZES)[number];

export const __SHIP_CHAT_VARIANTS = ['type-b', 'type-c', ''] as const;
export type ShipChatVariant = (typeof __SHIP_CHAT_VARIANTS)[number];
