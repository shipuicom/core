import { ShipConfig, ShipStylesManifest, defaultThemeColors, shipStylesUse, shipStylesWith } from '@ship-ui/core';
import { googleFontUrl } from '../font-picker/font-picker';

/** What the docs editor knobs map to outside the docs: the defaults baked into `@ship-ui/core/styles`. */
export const SHIP_TOKEN_DEFAULTS = {
  fontSize: 16,
  borderRadius: 1,
  borderWidth: 1,
  paddingY: 8,
  paddingX: 12,
} as const;

/** Palettes `$shipPalettes` can override by name. `base` is emitted separately by the library, so it gets custom properties instead. */
const SCSS_PALETTES = ['primary', 'accent', 'warn', 'error', 'success'] as const;

/** Keys the docs shell applies at runtime (as CSS custom properties) rather than through `SHIP_CONFIG`. */
const GLOBAL_KEYS: (keyof ShipConfig)[] = [
  'fontSize',
  'colors',
  'distribution',
  'borderRadius',
  'borderWidth',
  'paddingY',
  'paddingX',
  'fontFamily',
  'sidenavType',
];

export interface ShipConfigExport {
  /** `app.config.ts`: the component defaults, provided through `SHIP_CONFIG`. */
  ts: string;
  /** `styles.scss`: palettes through `$shipPalettes`, trimmed skins, the rest as custom properties on `html`. */
  scss: string;
  /** `ship-styles.json`: the colours, variants and skins kept; null when nothing is trimmed. */
  manifest: string | null;
}

export function parseHsl(hsl: string): [number, number, number] | null {
  const m = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  return m ? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])] : null;
}

/** The 12 (light, dark) steps the docs editor and `palettes.scss` `generate()` both derive from a step-8 colour. */
export function themeScale(hsl: string, distribution = 1): { light: string[]; dark: string[] } {
  const parsed = parseHsl(hsl);
  if (!parsed) return { light: [], dark: [] };
  const [h, s, l] = parsed;
  const clamped = l * 0.9;
  const start = l - clamped;
  const curve = (i: number, max: number) => Math.pow(i / max, distribution);
  const fmt = (x: number) => `hsl(${h}, ${s}%, ${Math.round(x * 100) / 100}%)`;
  const light: string[] = [];
  const dark: string[] = [];
  for (let i = 1; i <= 8; i++) {
    light.push(fmt(100 - (100 - l) * curve(i, 8)));
    dark.push(fmt(l * curve(i, 8)));
  }
  for (let i = 1; i <= 4; i++) {
    light.push(fmt(start + clamped * (1 - curve(i, 4))));
    dark.push(fmt(100 - (100 - l) * (1 - curve(i, 4))));
  }
  return { light, dark };
}

function isDefaultColor(name: string, config: ShipConfig) {
  const value = config.colors?.[name];
  return !value || value.replace(/\s/g, '') === defaultThemeColors[name]?.replace(/\s/g, '');
}

function isDefaultDistribution(name: string, config: ShipConfig) {
  const value = config.distribution?.[name];
  return value === undefined || Number(value) === 1;
}

function num(n: number) {
  return String(Math.round(n * 100) / 100);
}

export function exportShipScss(config: ShipConfig, styles: ShipStylesManifest = {}): string {
  const palettes: string[] = [];
  for (const name of SCSS_PALETTES) {
    if (isDefaultColor(name, config) && isDefaultDistribution(name, config)) continue;
    const parsed = parseHsl(config.colors?.[name] || defaultThemeColors[name]);
    if (!parsed) continue;
    const [h, s, l] = parsed;
    const dist = isDefaultDistribution(name, config) ? '' : `, ${num(config.distribution![name]!)}`;
    palettes.push(`    ${name}: (${num(h)}, ${num(s)}%, ${num(l)}%${dist}),`);
  }

  const tokens: string[] = [];
  const { fontSize, borderRadius, borderWidth, paddingY, paddingX, fontFamily } = config;
  if (fontSize !== undefined && Number(fontSize) !== SHIP_TOKEN_DEFAULTS.fontSize)
    tokens.push(`  --font-size: ${fontSize}px;`);
  if (borderRadius !== undefined && Number(borderRadius) !== SHIP_TOKEN_DEFAULTS.borderRadius)
    tokens.push(`  --shape-scale: ${borderRadius};`);
  if (borderWidth !== undefined && Number(borderWidth) !== SHIP_TOKEN_DEFAULTS.borderWidth)
    tokens.push(`  --border-width: ${borderWidth}px;`);
  if (paddingY !== undefined && Number(paddingY) !== SHIP_TOKEN_DEFAULTS.paddingY)
    tokens.push(`  --pad-y: ${paddingY}px;`);
  if (paddingX !== undefined && Number(paddingX) !== SHIP_TOKEN_DEFAULTS.paddingX)
    tokens.push(`  --pad-x: ${paddingX}px;`);
  if (fontFamily) tokens.push(`  --font-family: '${fontFamily}', sans-serif;`);

  // `base` is not a `$shipPalettes` entry (the library emits it after the palettes), so its scale is spelled out.
  const base: string[] = [];
  if (!isDefaultColor('base', config) || !isDefaultDistribution('base', config)) {
    const { light, dark } = themeScale(
      config.colors?.['base'] || defaultThemeColors['base'],
      config.distribution?.['base'] ?? 1
    );
    light.forEach((l, i) => base.push(`  --base-${i + 1}: light-dark(${l}, ${dark[i]});`));
    base.push(`  --base-g2: linear-gradient(180deg, ${light[5]} 0%, ${light[7]} 50%);`);
    base.push(`  --base-g3: linear-gradient(180deg, ${light[3]} 0%, ${light[7]} 50%);`);
  }

  const parts: string[] = [];
  parts.push(shipStylesUse(styles, palettes.length ? [`$shipPalettes: (\n${palettes.join('\n')}\n  )`] : []));
  // Sass wants `@use` first; it hoists this plain CSS import to the top of the output.
  if (fontFamily) parts.push(`\n@import url('${googleFontUrl(fontFamily)}');`);
  if (tokens.length) parts.push(`\nhtml {\n${tokens.join('\n')}\n}`);
  if (base.length) parts.push(`\nbody {\n${base.join('\n')}\n}`);
  return parts.join('\n') + '\n';
}

function formatValue(value: unknown, indent: string): string {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  if (value === null || typeof value !== 'object') return String(value);
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return '{}';
  const inner = indent + '  ';
  return `{\n${entries.map(([k, v]) => `${inner}${k}: ${formatValue(v, inner)},`).join('\n')}\n${indent}}`;
}

/** The component defaults, minus what `exportShipScss` covers, as a `SHIP_CONFIG` provider. */
export function exportShipTs(config: ShipConfig): string {
  const components: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (GLOBAL_KEYS.includes(key as keyof ShipConfig)) continue;
    if (value === undefined || value === '' || (typeof value === 'object' && !Object.keys(value as object).length))
      continue;
    components[key] = value;
  }
  const body = Object.keys(components).length
    ? formatValue(components, '')
    : '{\n  // No component defaults changed: every component keeps its built-in variant, colour and size.\n}';
  return `import { ApplicationConfig } from '@angular/core';
import { SHIP_CONFIG, ShipConfig } from '@ship-ui/core';

export const shipConfig: ShipConfig = ${body};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: SHIP_CONFIG, useValue: shipConfig },
  ],
};
`;
}

export function exportShipConfig(config: ShipConfig, styles: ShipStylesManifest = {}): ShipConfigExport {
  return {
    ts: exportShipTs(config),
    scss: exportShipScss(config, styles),
    manifest: shipStylesWith(styles).length ? JSON.stringify(styles, null, 2) + '\n' : null,
  };
}
