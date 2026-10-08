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
export const SHIP_GLOBAL_KEYS = [
  'fontSize',
  'colors',
  'distribution',
  'borderRadius',
  'borderWidth',
  'paddingY',
  'paddingX',
  'fontFamily',
  'sidenavType',
] as const satisfies readonly (keyof ShipConfig)[];
const GLOBAL_KEYS: readonly (keyof ShipConfig)[] = SHIP_GLOBAL_KEYS;

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
  const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : formatValue(k, ''));
  return `{\n${entries.map(([k, v]) => `${inner}${key(k)}: ${formatValue(v, inner)},`).join('\n')}\n${indent}}`;
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
  /** `ts`: an exported app.config.ts, which only carries component defaults (globals live in ship-config.json). */
  source: 'json' | 'ts';
  /** Human readable notes on what was dropped or migrated. */
  ignored: string[];
}

const NUMBER_KEYS = ['fontSize', 'borderRadius', 'borderWidth', 'paddingY', 'paddingX'] as const;
/** Every `ShipConfig` key whose value is a `ShipComponentConfig`. Keep in sync with ship-config.ts. */
export const SHIP_COMPONENT_KEYS = [
  'button', 'chip', 'alert', 'progressBar', 'spinner', 'card', 'toggleCard', 'table', 'buttonGroup', 'checkbox',
  'radio', 'toggle', 'formField', 'icon', 'stepper', 'select', 'accordion', 'tabs', 'eventCard', 'datepicker',
  'rangeSlider', 'layoutPage', 'layoutSection', 'layoutSetting', 'layoutEmptyState', 'layoutStat', 'layoutStatTrend',
  'layoutStatGoal', 'layoutStatRing', 'layoutRanking', 'layoutAchievement', 'layoutInbox', 'layoutTableView',
  'layoutDetails', 'layoutTimeline', 'layoutToolbar', 'breadcrumbs', 'chat', 'avatar', 'chartSparkline',
  'colorPickerInput', 'editor', 'themeToggle', 'video', 'videoPlaylist', 'blockBanner', 'blockHeader', 'blockHero',
  'blockLogos', 'blockFeatures', 'blockSplit', 'blockSteps', 'blockStats', 'blockTestimonials', 'blockPricing', 'blockFaq',
  'blockCta', 'blockNewsletter', 'blockTeam', 'blockPosts', 'blockContact', 'blockFooter',
] as const satisfies readonly (keyof ShipConfig)[];
const COMPONENT_STRING_KEYS = ['color', 'variant', 'size'];
const COMPONENT_BOOLEAN_KEYS = ['readonly', 'sharp', 'dynamic', 'alwaysShow', 'disableUnfocus'];
/** Removed top-level keys (see projects/ship-ui/MIGRATION.md) and the component they moved to as `variant`. */
const LEGACY_VARIANT_KEYS: Record<string, string> = { alertVariant: 'alert', cardType: 'card', tableType: 'table' };

function sanitizeComponent(path: string, raw: unknown, ignored: string[]): Record<string, unknown> | undefined {
  if (!isObject(raw)) {
    ignored.push(`${path} (expected an object)`);
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null || v === '') continue;
    if (COMPONENT_STRING_KEYS.includes(k)) {
      if (typeof v === 'string') out[k] = v;
      else ignored.push(`${path}.${k} (expected a string)`);
    } else if (COMPONENT_BOOLEAN_KEYS.includes(k) && (k !== 'disableUnfocus' || path === 'icon')) {
      if (typeof v === 'boolean') out[k] = v;
      else ignored.push(`${path}.${k} (expected true/false)`);
    } else ignored.push(`${path}.${k} (unknown option)`);
  }
  return out;
}

function sanitizeMap(path: string, raw: unknown, type: 'string' | 'number', ignored: string[]) {
  if (!isObject(raw)) {
    ignored.push(`${path} (expected an object)`);
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null || v === '') continue;
    if (type === 'string' ? typeof v === 'string' : typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else ignored.push(`${path}.${k} (expected a ${type})`);
  }
  return out;
}

/**
 * Coerces untrusted data (an import, or editor state persisted by an older version) into a valid `ShipConfig`:
 * legacy keys are migrated, unknown keys and wrongly typed values are dropped and listed in `ignored`.
 */
/**
 * A styles manifest cleaned to the shape `shipStylesWith` reads: string lists for colours and variants, known skins
 * whose entry is `false` or an object of string lists. Anything else is dropped and listed in `ignored`; never throws.
 */
export function sanitizeShipStyles(raw: unknown): { styles: ShipStylesManifest; ignored: string[] } {
  const ignored: string[] = [];
  const styles: ShipStylesManifest = {};
  if (raw === undefined || raw === null) return { styles, ignored };
  if (!isObject(raw)) return { styles, ignored: ['styles (expected an object)'] };
  const names = (value: unknown, path: string): string[] | undefined => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) {
      ignored.push(`${path} (expected a list of names)`);
      return undefined;
    }
    const kept = value.filter((x): x is string => typeof x === 'string');
    if (kept.length !== value.length) ignored.push(`${path} (non-text entries dropped)`);
    return kept;
  };
  const colors = names(raw['colors'], 'styles.colors');
  if (colors) styles.colors = colors;
  const variants = names(raw['variants'], 'styles.variants');
  if (variants) styles.variants = variants;
  const skins = raw['skins'];
  if (skins !== undefined) {
    if (!isObject(skins)) ignored.push('styles.skins (expected an object)');
    else {
      const out: NonNullable<ShipStylesManifest['skins']> = {};
      for (const [skin, entry] of Object.entries(skins)) {
        if (!(SHIP_STYLE_SKINS as readonly string[]).includes(skin)) {
          ignored.push(`styles.skins.${skin} (unknown skin)`);
          continue;
        }
        const key = skin as keyof typeof out;
        if (entry === false) out[key] = false;
        else if (isObject(entry)) {
          const clean: { colors?: string[]; variants?: string[] } = {};
          const c = names(entry['colors'], `styles.skins.${skin}.colors`);
          if (c) clean.colors = c;
          const v = names(entry['variants'], `styles.skins.${skin}.variants`);
          if (v) clean.variants = v;
          out[key] = clean;
        } else ignored.push(`styles.skins.${skin} (expected false or an object)`);
      }
      styles.skins = out;
    }
  }
  return { styles, ignored };
}

export function sanitizeShipConfig(raw: unknown): { config: ShipConfig; ignored: string[] } {
  const ignored: string[] = [];
  if (!isObject(raw)) return { config: {}, ignored: raw === undefined || raw === null ? [] : ['config (expected an object)'] };
  const src: Record<string, unknown> = { ...raw };

  if ('event-card' in src) {
    if (src['eventCard'] === undefined) src['eventCard'] = src['event-card'];
    delete src['event-card'];
    ignored.push("'event-card' (renamed to eventCard)");
  }
  for (const [legacy, component] of Object.entries(LEGACY_VARIANT_KEYS)) {
    if (!(legacy in src)) continue;
    const value = src[legacy];
    delete src[legacy];
    const target = isObject(src[component]) ? { ...(src[component] as Record<string, unknown>) } : {};
    const slotFree = src[component] === undefined || isObject(src[component]);
    if (typeof value === 'string' && value && slotFree && target['variant'] === undefined) {
      src[component] = { ...target, variant: value };
      ignored.push(`${legacy} (moved to ${component}.variant)`);
    } else ignored.push(`${legacy} (removed)`);
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (value === undefined || value === null || value === '') continue;
    if ((NUMBER_KEYS as readonly string[]).includes(key)) {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
      else ignored.push(`${key} (expected a number)`);
    } else if (key === 'fontFamily') {
      if (typeof value === 'string') out[key] = value;
      else ignored.push(`${key} (expected a string)`);
    } else if (key === 'colors' || key === 'distribution') {
      const map = sanitizeMap(key, value, key === 'colors' ? 'string' : 'number', ignored);
      if (map && Object.keys(map).length) out[key] = map;
    } else if ((SHIP_COMPONENT_KEYS as readonly string[]).includes(key)) {
      const c = sanitizeComponent(key, value, ignored);
      if (c && Object.keys(c).length) out[key] = c;
    } else if (key === 'dialogType') {
      if (value === 'type-b') out[key] = value;
      else ignored.push(`${key} (expected 'type-b')`);
    } else if (key === 'sidenavType') {
      if (value === 'overlay' || value === 'simple') out[key] = value;
      else ignored.push(`${key} (expected 'overlay' or 'simple')`);
    } else ignored.push(`${key} (unknown key)`);
  }
  return { config: out as ShipConfig, ignored };
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
  let source: 'json' | 'ts' = 'json';
  try {
    data = JSON.parse(trimmed);
  } catch {
    const json = tsLiteralToJson(trimmed);
    if (!json) return { error: 'Expected JSON (ship-config.json / ship-styles.json) or an exported app.config.ts.' };
    try {
      data = { config: JSON.parse(json) };
      source = 'ts';
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

  const { config: clean, ignored } = sanitizeShipConfig(config);
  const { styles: cleanStyles, ignored: ignoredStyles } = sanitizeShipStyles(styles);
  return { config: clean, styles: cleanStyles, source, ignored: [...ignored, ...ignoredStyles] };
}
