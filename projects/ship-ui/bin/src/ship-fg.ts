#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { FSWatcher, watch } from 'fs';
import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const _dirname = dirname(fileURLToPath(import.meta.url));

import subsetFont from './subset';

import { formatFileSize, InputArguments, SupportedFontTypes } from './utilities';

const CWD_PATH = process.cwd();
const PHOSPHOR_SRC_PATH = resolve(CWD_PATH, 'node_modules', '@phosphor-icons', 'web', 'src');

const jsScannerFallback = async (PROJECT_SRC: string, shipUiDir: string, CWD_PATH: string) => {
  const uniqueIcons = new Set<string>();

  const isValidIcon = (s: string) => /^[a-z0-9-]+$/.test(s);

  try {
    const pkgPath = resolve(shipUiDir, 'package.json');
    const pkgData = JSON.parse(await readFile(pkgPath, 'utf8'));
    if (pkgData.libraryIcons) {
      pkgData.libraryIcons.forEach((i: string) => uniqueIcons.add(i));
    }
  } catch (e) {}

  async function scanDir(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.name.endsWith('.html') || entry.name.endsWith('.ts')) {
        const contents = await readFile(fullPath, 'utf8');

        const htmlStartMatches = contents.matchAll(/<sh-icon[^>]*icon=['"]([^'"]+)['"][^>]*>/g);
        for (const m of htmlStartMatches) {
          const icon = m[1].trim();
          if (isValidIcon(icon)) uniqueIcons.add(icon);
        }
        const htmlContentMatches = contents.matchAll(/<sh-icon[^>]*>([^<]+)<\/sh-icon>/g);
        for (const m of htmlContentMatches) {
          const icon = m[1].trim();
          if (isValidIcon(icon)) uniqueIcons.add(icon);
        }

        const tsMatches = contents.matchAll(/shicon:([^'"]+)['"]/g);
        for (const m of tsMatches) {
          const icon = m[1].trim();
          if (isValidIcon(icon)) uniqueIcons.add(icon);
        }
      }
    }
  }
  await scanDir(PROJECT_SRC);

  const variants = ['bold', 'thin', 'light', 'fill', 'regular', 'duotone'];
  const glyphMaps = new Map<string, [string, string]>();

  for (const variant of variants) {
    try {
      const selPath = resolve(CWD_PATH, 'node_modules', '@phosphor-icons', 'web', 'src', variant, 'selection.json');
      const parsed = JSON.parse(await readFile(selPath, 'utf8'));
      const isDuotone = variant === 'duotone';

      for (const icon of parsed.icons || []) {
        const hexCode = icon.properties.code.toString(16);
        const unicodeStr = `U+${hexCode}`;
        const glyph = String.fromCodePoint(icon.properties.code);

        let glyphName = isDuotone ? icon.properties.name : icon.properties.ligatures;
        if (glyphName) glyphMaps.set(glyphName, [glyph, unicodeStr]);
      }
    } catch (e) {}
  }

  const grouped = {
    bold: [] as [string, string][],
    thin: [] as [string, string][],
    light: [] as [string, string][],
    fill: [] as [string, string][],
    regular: [] as [string, string][],
    duotone: [] as [string, string][],
    text: [] as [string, string][],
    missing: [] as string[],
  };

  for (const icon of uniqueIcons) {
    const isBold = icon.endsWith('-bold');
    const isThin = icon.endsWith('-thin');
    const isLight = icon.endsWith('-light');
    const isFill = icon.endsWith('-fill');
    const isDuotone = icon.endsWith('-duotone');
    const isRegular = !isBold && !isThin && !isLight && !isFill && !isDuotone;

    const mapEntry = glyphMaps.get(icon);
    if (mapEntry) {
      const tuple1: [string, string] = [icon, ''];
      const tuple2 = mapEntry; // [glyph, unicodeStr]
      if (isBold) grouped.bold.push(tuple1, tuple2);
      else if (isThin) grouped.thin.push(tuple1, tuple2);
      else if (isLight) grouped.light.push(tuple1, tuple2);
      else if (isFill) grouped.fill.push(tuple1, tuple2);
      else if (isDuotone) grouped.duotone.push(tuple1, tuple2);
      else grouped.regular.push(tuple1, tuple2);
    } else {
      grouped.missing.push(icon);
    }
  }

  return grouped;
};

let writtenCssSize = 0;
let compressedCssSize = 0;
let watchers: FSWatcher[] = [];

const run = async (
  PROJECT_SRC: string,
  PROJECT_PUBLIC: string,
  TARGET_FONT_TYPE: SupportedFontTypes,
  values: InputArguments
) => {
  const startTime = performance.now();
  const actualDir = _dirname;
  const scannerPath = resolve(actualDir, './ship-fg-scanner');
  const shipUiDir = resolve(actualDir, '../');

  let groupedIcons: { [key: string]: [string, string][] } = {};
  let missingIconsArray: string[] = [];

  try {
    const proc = spawnSync(scannerPath, [PROJECT_SRC, shipUiDir, CWD_PATH]);
    if (proc.error || proc.status !== 0) {
      throw new Error('Native scanner failed');
    }

    const { missing, ...rest } = JSON.parse(proc.stdout?.toString() || '{}');
    groupedIcons = rest;
    missingIconsArray = missing || [];
  } catch (err) {
    try {
      const { missing, ...rest } = await jsScannerFallback(PROJECT_SRC, shipUiDir, CWD_PATH);
      groupedIcons = rest;
      missingIconsArray = missing || [];
    } catch (fallbackErr) {
      console.error('Failed to run high-performance zig scanner and the javascript fallback failed:', fallbackErr);
      throw err;
    }
  }

  if (missingIconsArray.length) {
    console.log('Following icons does not exist in font: \n ', missingIconsArray);
  }

  writeCssFile(PROJECT_PUBLIC, values, groupedIcons, TARGET_FONT_TYPE);

  const fontTypes = ['bold', 'thin', 'light', 'fill', 'regular'].filter((x) => groupedIcons[x].length > 0);
  const fonts = fontTypes.map(async (fontType) => {
    const glyphs = uniqueString(groupedIcons[fontType].map((icon) => icon[0]).join(''));
    const fullPath = join(
      PHOSPHOR_SRC_PATH,
      fontType,
      `Phosphor${fontType === 'regular' ? '' : '-' + capitalize(fontType)}.ttf`
    );
    const fileBuffer = await readFile(fullPath);
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
    const subsetBuffer = await subsetFont(Buffer.from(arrayBuffer), glyphs);

    return subsetBuffer;
  });

  const _fonts = await Promise.all(fonts);
  let totalFontSize = 0;
  let totalCompressedFontSize = 0;

  for (let i = 0; i < _fonts.length; i++) {
    const subsetBuffer = _fonts[i];
    const fontType = fontTypes[i];
    const fontPath = `${PROJECT_PUBLIC}/sh${fontType === 'regular' ? '' : '-' + fontType}.${TARGET_FONT_TYPE}`;
    await writeFile(fontPath, subsetBuffer);
    const fontWrites = subsetBuffer.byteLength;

    const compressedFont = gzipSync(subsetBuffer);
    const iconsOnGroup = groupedIcons[fontType].filter((icon) => icon[1] === '').map((icon) => icon[0]);

    totalFontSize += fontWrites;
    totalCompressedFontSize += compressedFont.length;

    if (values.verbose) {
      console.log('Group: ', fontType, '\n', iconsOnGroup);
      console.log(
        `Font & CSS (Generated/Compressed size): ${formatFileSize(fontWrites)}/${formatFileSize(compressedFont.length)}`
      );

      console.log(' ');
    }
  }

  const endTime = performance.now();
  const runtime = endTime - startTime;
  console.log(
    `Font & CSS (Generated/Compressed size): ${formatFileSize(totalFontSize + writtenCssSize)}/${formatFileSize(totalCompressedFontSize + compressedCssSize)}`
  );
  console.log('Time taken: ', runtime.toFixed(2) + 'ms');
  console.log(' ');
};

function uniqueString(s: string): string {
  const seen = new Set<string>();
  let result = '';

  for (const char of s) {
    if (!seen.has(char)) {
      seen.add(char);
      result += char;
    }
  }

  return result;
}

const writeCssFile = async (
  PROJECT_PUBLIC: string,
  values: InputArguments,
  groupedIcons: { [key: string]: [string, string][] },
  TARGET_FONT_TYPE = 'woff2'
) => {
  const groupedIconsEntries = Object.entries(groupedIcons).map(([key, value], i) => {
    if (key === 'text') return '';

    const suffix = key === 'regular' ? '' : '-' + key;
    const fontUrl = `url('${values.rootPath}sh${suffix}.${TARGET_FONT_TYPE}') format('${TARGET_FONT_TYPE === 'ttf' ? 'truetype' : TARGET_FONT_TYPE}')`;

    return `
@font-face {
  font-family: 'sh${suffix}';
  src: ${fontUrl};
  font-weight: normal;
  font-style: normal;
  font-display: block;
}`;
  });

  const keys = Object.keys(groupedIcons).map((key) => {
    if (['regular', 'text'].includes(key)) return '';

    const suffix = key === 'regular' ? '' : '-' + key;

    return `
sh-icon.${key} {
  font-family: 'sh${suffix}' !important;
}`;
  });

  const cssFileContent = `
  ${groupedIconsEntries.join('\n')}
  ${keys.join('\n')}
sh-icon {
  font-family: "sh" !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  letter-spacing: 0;
  -webkit-font-feature-settings: "liga";
  -moz-font-feature-settings: "liga=1";
  -moz-font-feature-settings: "liga";
  -ms-font-feature-settings: "liga" 1;
  font-feature-settings: "liga";
  -webkit-font-variant-ligatures: discretionary-ligatures;
  font-variant-ligatures: discretionary-ligatures;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;
  await writeFile(`${PROJECT_PUBLIC}/ship.css`, cssFileContent);
  const cssWrites = Buffer.byteLength(cssFileContent);
  const compressedCss = gzipSync(cssFileContent);

  writtenCssSize = cssWrites;
  compressedCssSize = compressedCss.length;
};

const textMateSnippet = async (GLYPH_MAP: Record<string, [string, string]>) => {
  const iconsSnippetContent = `
  {
    "Phosphor icons": {
      "prefix": ["shicon:"],
      "scope": "javascript,typescript,html",
      "body": "\${1|${Object.keys(GLYPH_MAP).join(',')}|}",
      "description": "Add a phosphor icon"
    },
    "Ship sh-icon": {
      "prefix": ["sh-icon"],
      "scope": "html",
      "body": "<sh-icon>\${1|${Object.keys(GLYPH_MAP).join(',')}|}</sh-icon>",
      "description": "Add a ship phosphor icon"
    }
  }
  `;

  try {
    await mkdir('./.vscode', { recursive: true });
    await writeFile('./.vscode/html.code-snippets', iconsSnippetContent);
  } catch (error) {
    // Gracefully ignore snippet generation failures (e.g. in read-only CI environments)
    console.warn('⚠️ Could not generate VS Code snippets:', error);
  }
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const main = async (values: InputArguments) => {
  const TARGET_FONT_TYPE: SupportedFontTypes = 'woff2' as SupportedFontTypes;
  const actualDir = _dirname;
  const packageJsonPath = resolve(actualDir, '../package.json');
  const PROJECT_SRC = values.src;
  const PROJECT_PUBLIC = values.out;

  const selectionJsonPath = resolve(PHOSPHOR_SRC_PATH, 'regular', 'selection.json');
  const selectionData = await readFile(selectionJsonPath, 'utf8');
  const GLYPH_MAP = JSON.parse(selectionData).icons.reduce(
    (acc: Record<string, [string, string]>, iconWrapper: any) => {
      const name = iconWrapper.properties.name;
      acc[name] = [name, ''];
      return acc;
    },
    {} as Record<string, [string, string]>
  );

  try {
    await textMateSnippet(GLYPH_MAP);
    await run(PROJECT_SRC, PROJECT_PUBLIC, TARGET_FONT_TYPE, values);
  } catch (error) {
    console.error('An error occurred during the initial run:', error);
    if (!values.watch && !values.watchLib) {
      process.exit(1);
    }
  }

  if (!values.watch && !values.watchLib) {
    return;
  }

  console.log('\nWatching for file changes. Press Cmd+C to stop.');

  process.on('SIGINT', killWatchers);
  process.on('SIGTERM', killWatchers);
  process.on('SIGBREAK', killWatchers);

  const debouncedRun = debounce(async (triggerName: string | null) => {
    console.log(`Change detected (${triggerName}), regenerating...`);
    try {
      await run(PROJECT_SRC, PROJECT_PUBLIC, TARGET_FONT_TYPE, values);
    } catch (error) {
      console.error('Error during watched run:', error);
    }
  }, 50);

  if (values.watch) {
    const excludeFolders = ['node_modules', '.git', '.vscode', 'bin', 'assets'].concat([PROJECT_PUBLIC]);
    watchers.push(
      watch(PROJECT_SRC, { recursive: true }, (_, filename) => {
        if (filename && !excludeFolders.some((folder) => resolve(join(PROJECT_SRC, filename)).includes(folder))) {
          debouncedRun(filename);
        }
      })
    );
  }

  if (values.watchLib) {
    watchers.push(
      watch(packageJsonPath, {}, (_, filename) => {
        debouncedRun(filename || 'package.json');
      })
    );
  }
};

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

function killWatchers() {
  console.log(`\n✅ The icon font generation watch process has been stopped.`);

  for (let index = 0; index < watchers.length; index++) {
    try {
      const watcher = watchers[index];
      watcher.close();
      if (typeof watcher.removeAllListeners === 'function') {
        watcher.removeAllListeners();
      }
    } catch (e) {
      // Ignore native watcher cleanup errors
    }
  }

  process.exit(0);
}
