import {
  SHIP_STYLE_SKINS,
  ShipConfig,
  ShipStylesManifest,
  defaultThemeColors,
  shipStylesUse,
  shipStylesWith,
} from '@ship-ui/core';
import { googleFontUrl } from './google-fonts';

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
  /** `ship-config.json`: everything above as data; re-importable here and read by `ship-styles`. */
  json: string;
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
    json: exportShipEditorJson(config, styles),
  };
}

/** `ship-config.json`: the editor state in one file, for re-importing here and for `ship-styles` (reads `styles`). */
export function exportShipEditorJson(config: ShipConfig, styles: ShipStylesManifest): string {
  const { sidenavType, ...rest } = config;
  const out: { config?: ShipConfig; styles?: ShipStylesManifest } = {};
  if (Object.keys(rest).length) out.config = rest;
  if (shipStylesWith(styles).length) out.styles = styles;
  return JSON.stringify(out, null, 2) + '\n';
}

export interface ShipConfigImport {
  config: ShipConfig;
  styles: ShipStylesManifest;
}

const STYLE_KEYS = ['colors', 'variants', 'skins'];
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const TS_ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0' };
/** Decodes the escapes a TS string literal can hold (`\'`, `\"`, `\\`, `\n`, `\xHH`, `\uHHHH`, …) into the actual characters. */
function unescapeTs(raw: string): string {
  return raw.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[\s\S])/g, (_, e: string) =>
    e[0] === 'x' || e[0] === 'u' ? String.fromCharCode(parseInt(e.slice(1), 16)) : (TS_ESCAPES[e] ?? e)
  );
}

/** The object literal after `shipConfig: ShipConfig =` in an exported app.config.ts, as JSON (no eval). */
function tsLiteralToJson(text: string): string | null {
  const start = text.match(/shipConfig\s*(?::\s*ShipConfig)?\s*=\s*\{/);
  if (!start) return null;
  let i = start.index! + start[0].length - 1;
  const from = i;
  let depth = 0;
  let quote: string | null = null;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"') quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  // Strings are set aside first so that `//` or `, key:` inside a value cannot be mistaken for a comment or a key.
  const strings: string[] = [];
  return text
    .slice(from, i + 1)
    .replace(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g, (_, single: string | undefined, double: string | undefined) => {
      strings.push(JSON.stringify(unescapeTs(single ?? double ?? '')));
      return `\u0000${strings.length - 1}\u0000`;
    })
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/\u0000(\d+)\u0000/g, (_, n: string) => strings[Number(n)]);
}

/**
 * Reads what a user pastes or drops into the import dialog: `ship-config.json` ({ config, styles }),
 * a `ship-styles.json`, a bare ShipConfig object, or the exported `app.config.ts`.
 */
export function parseShipConfigImport(text: string): ShipConfigImport | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { error: 'Nothing to import.' };

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    const json = tsLiteralToJson(trimmed);
    if (!json) return { error: 'Expected JSON (ship-config.json / ship-styles.json) or an exported app.config.ts.' };
    try {
      data = { config: JSON.parse(json) };
    } catch {
      return { error: 'Could not read the shipConfig object in that app.config.ts.' };
    }
  }
  if (!isObject(data)) return { error: 'Expected a JSON object.' };

  let config: unknown = {};
  let styles: unknown = {};
  if ('config' in data || 'styles' in data) {
    config = data['config'] ?? {};
    styles = data['styles'] ?? {};
  } else if (
    Object.keys(data).length &&
    Object.keys(data).every(k => STYLE_KEYS.includes(k)) &&
    // `colors` is also a ShipConfig key (the theme colour map): only lists mean a styles manifest.
    (Array.isArray(data['colors']) || Array.isArray(data['variants']) || 'skins' in data)
  ) {
    styles = data;
  } else {
    config = data;
  }
  if (!isObject(config)) return { error: '"config" must be an object.' };
  if (!isObject(styles)) return { error: '"styles" must be an object.' };

  for (const key of ['colors', 'variants'] as const) {
    const list = styles[key];
    if (list !== undefined && !(Array.isArray(list) && list.every(x => typeof x === 'string')))
      return { error: `"styles.${key}" must be a list of names.` };
  }
  const skins = styles['skins'];
  if (skins !== undefined) {
    if (!isObject(skins)) return { error: '"styles.skins" must be an object.' };
    const unknown = Object.keys(skins).filter(s => !(SHIP_STYLE_SKINS as readonly string[]).includes(s));
    if (unknown.length) return { error: `Unknown skin(s): ${unknown.join(', ')}.` };
  }

  return { config: config as ShipConfig, styles: styles as ShipStylesManifest };
}
