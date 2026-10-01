/**
 * What `@ship-ui/core/styles` emits: the colour classes, sheet variants and skins a project keeps.
 * The docs config editor writes it, `ship-styles` turns a `ship-styles.json` into the `@use ... with (...)` block,
 * and a template scanner can later fill it the way `ship-fg` fills the icon font.
 */

/** Built-in palettes every skin can emit a colour class for. */
export const SHIP_STYLE_COLORS = ['primary', 'accent', 'warn', 'error', 'success'] as const;

/** Sheet variants (`$shipVariants`). */
export const SHIP_STYLE_VARIANTS = ['simple', 'outlined', 'flat', 'raised'] as const;

/** Skins in `styles/skins/_index.scss`; each maps to a `$ship<Name>` flag. */
export const SHIP_STYLE_SKINS = [
  'sheet',
  'spinner',
  'icon',
  'progressBar',
  'tabs',
  'tooltip',
  'toggle',
  'rangeSlider',
  'radio',
  'chip',
  'datepicker',
  'stepper',
  'avatar',
  'codeInput',
  'video',
  'formField',
  'alert',
  'button',
  'listItemSwipe',
  'list',
  'chat',
  'layoutStat',
  'layoutStatTrend',
  'layoutStatGoal',
  'layoutStatRing',
  'layoutRanking',
  'layoutAchievement',
] as const;

export type ShipStyleSkin = (typeof SHIP_STYLE_SKINS)[number];

/** Per skin: `false` drops it, a list pair narrows it below the global lists. */
export type ShipStyleSkinEntry = false | { colors?: string[]; variants?: string[] };

export interface ShipStylesManifest {
  /** Colour classes every skin emits (`$shipColors`); omitted = every palette. */
  colors?: string[];
  /** Sheet variants every skin emits (`$shipVariants`); omitted = all four. */
  variants?: string[];
  skins?: Partial<Record<ShipStyleSkin, ShipStyleSkinEntry>>;
}

const list = (items: string[]) => (items.length ? `(${items.join(', ')})` : '()');
const flag = (skin: string) => `$ship${skin[0].toUpperCase()}${skin.slice(1)}`;
const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every(x => b.includes(x));

/** The `$name: value` entries of the `@use '@ship-ui/core/styles' with (...)` block; empty when nothing is trimmed. */
export function shipStylesWith(manifest: ShipStylesManifest): string[] {
  const out: string[] = [];
  if (manifest.colors && !sameSet(manifest.colors, SHIP_STYLE_COLORS)) out.push(`$shipColors: ${list(manifest.colors)}`);
  if (manifest.variants && !sameSet(manifest.variants, SHIP_STYLE_VARIANTS))
    out.push(`$shipVariants: ${list(manifest.variants)}`);

  const overrides: string[] = [];
  for (const [skin, entry] of Object.entries(manifest.skins ?? {})) {
    if (entry === false) {
      out.push(`${flag(skin)}: false`);
      continue;
    }
    if (!entry) continue;
    const parts: string[] = [];
    if (entry.colors) parts.push(`colors: ${list(entry.colors)}`);
    if (entry.variants) parts.push(`variants: ${list(entry.variants)}`);
    if (parts.length) overrides.push(`${skin}: (${parts.join(', ')})`);
  }
  if (overrides.length) out.push(`$shipSkins: (\n    ${overrides.join(',\n    ')},\n  )`);
  return out;
}

/** A `styles.scss` head for the manifest, with any extra `with` entries (e.g. `$shipPalettes`) appended. */
export function shipStylesUse(manifest: ShipStylesManifest, extra: string[] = []): string {
  const entries = [...shipStylesWith(manifest), ...extra];
  return entries.length
    ? `@use '@ship-ui/core/styles' with (\n  ${entries.join(',\n  ')},\n);`
    : `@use '@ship-ui/core/styles';`;
}
