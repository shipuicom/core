import { promises as fs, watch } from 'fs';
import { glob } from 'glob'; // Using the 'glob' package for file scanning
import path, { join, resolve } from 'path';
import { performance } from 'perf_hooks'; // For performance.now()
import zlib from 'zlib'; // For gzip compression

import subsetFont from 'subset-font';

import { fileURLToPath } from 'url';
import { formatFileSize, getUnicodeObject } from './utilities.ts'; // Assuming utilities.js is now ESM compatible

let writtenCssSize = 0;
let compressedCssSize = 0;

interface InputArguments {
  src: string;
  out: string;
  watch: boolean;
  watchLib: boolean;
  verbose: boolean;
  rootPath: string;
}

type SupportedFontTypes = 'ttf' | 'woff2';

const run = async (
  PROJECT_SRC: string,
  LIB_ICONS: string[],
  PROJECT_PUBLIC: string,
  GLYPH_MAP: Record<string, [string, string]>,
  TARGET_FONT_TYPE: SupportedFontTypes,
  values: InputArguments
) => {
  const startTime = performance.now();

  const regex = /<spk-icon[^>]*>\s*((?!{{.*?}})[^<]*?)\s*<\/spk-icon>/g;
  const regex2 = /ppicon:([^']+)/g;
  const iconsFound = new Set<string>(LIB_ICONS);
  const missingIcons = new Set<string>();

  // Scan HTML files
  const htmlFiles = await glob('**/*.html', { cwd: PROJECT_SRC });
  for (const file of htmlFiles) {
    const fileText = await fs.readFile(join(PROJECT_SRC, file), 'utf8');
    const matches = Array.from(fileText.matchAll(regex), (m: string[]) => m[1]);

    if (matches?.length) {
      for (const match of matches) {
        if (match) iconsFound.add(match);
      }
    }
  }

  // Scan TypeScript files
  const tsFiles = await glob('**/*.ts', { cwd: PROJECT_SRC });
  for (const file of tsFiles) {
    const fileText = await fs.readFile(join(PROJECT_SRC, file), 'utf8');
    const matches = Array.from(fileText.matchAll(regex2), (m: string[]) => m[1]);

    if (matches?.length) {
      for (const match of matches) {
        if (match) iconsFound.add(match);
      }
    }
  }

  const groupedIcons = Array.from(iconsFound).reduce(
    (acc, icon) => {
      const bold = icon.endsWith('-bold');
      const thin = icon.endsWith('-thin');
      const light = icon.endsWith('-light');
      const fill = icon.endsWith('-fill');
      const regular = !bold && !thin && !light && !fill;
      const glyph = GLYPH_MAP[icon];

      if (!glyph) {
        missingIcons.add(icon);
        return acc;
      }

      if (bold) {
        acc['bold'].push([icon, '']);
        acc['bold'].push(glyph);
      }
      if (thin) {
        acc['thin'].push([icon, '']);
        acc['thin'].push(glyph);
      }
      if (light) {
        acc['light'].push([icon, '']);
        acc['light'].push(glyph);
      }
      if (fill) {
        acc['fill'].push([icon, '']);
        acc['fill'].push(glyph);
      }
      if (regular) {
        acc['regular'].push([icon, '']);
        acc['regular'].push(glyph);
      }

      return acc;
    },
    {
      bold: [],
      thin: [],
      light: [],
      fill: [],
      regular: [],
      text: [],
    } as {
      [key: string]: [string, string][];
    }
  );

  const missingIconsArray = Array.from(missingIcons);

  if (missingIconsArray.length) {
    console.log('Following icons does not exist in font: \n ', missingIconsArray);
  }

  await writeCssFile(PROJECT_PUBLIC, values, groupedIcons, TARGET_FONT_TYPE);

  // We don't load fonts we don't use
  const fontTypes = ['bold', 'thin', 'light', 'fill', 'regular'].filter((x) => groupedIcons[x].length > 0);
  const targetFormat = TARGET_FONT_TYPE === 'ttf' ? 'truetype' : TARGET_FONT_TYPE;
  const fonts = fontTypes.map(async (fontType) => {
    const glyphs = uniqueString(groupedIcons[fontType].map((icon) => icon[0]).join(''));
    const fontFileName = `Phosphor${fontType === 'regular' ? '' : '-' + capitalize(fontType)}.${TARGET_FONT_TYPE}`;
    const fullPath = path.resolve(
      process.cwd(),
      'node_modules',
      '@phosphor-icons',
      'web',
      'src',
      fontType,
      fontFileName
    );

    const arrayBuffer = await fs.readFile(fullPath);
    const subsetBuffer = await subsetFont(arrayBuffer, glyphs, {
      targetFormat,
      noLayoutClosure: true,
    } as any); // Type assertion is kept as in original

    return subsetBuffer;
  });

  const _fonts = await Promise.all(fonts);
  let totalFontSize = 0;
  let totalCompressedFontSize = 0;

  for (let i = 0; i < _fonts.length; i++) {
    const subsetBuffer = _fonts[i];
    const fontType = fontTypes[i];
    const outputPath = `${PROJECT_PUBLIC}/spk${fontType === 'regular' ? '' : '-' + fontType}.${TARGET_FONT_TYPE}`;

    await fs.writeFile(outputPath, subsetBuffer);
    const fontWrites = subsetBuffer.length; // fs.writeFile doesn't return bytes written, use buffer length

    const compressedFont = zlib.gzipSync(subsetBuffer);
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
    const fontUrl = `url('${values.rootPath}spk${suffix}.${TARGET_FONT_TYPE}') format('${TARGET_FONT_TYPE === 'ttf' ? 'truetype' : TARGET_FONT_TYPE}')`;

    return `
@font-face {
  font-family: 'spk${suffix}';
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
spk-icon.${key} {
  font-family: 'spk${suffix}' !important;
}`;
  });

  const cssFileContent = `
  ${groupedIconsEntries.join('\n')}
  ${keys.join('\n')}
spk-icon {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: "spk" !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Enable Ligatures ================ */
  letter-spacing: 0;
  -webkit-font-feature-settings: "liga";
  -moz-font-feature-settings: "liga=1";
  -moz-font-feature-settings: "liga";
  -ms-font-feature-settings: "liga" 1;
  font-feature-settings: "liga";
  -webkit-font-variant-ligatures: discretionary-ligatures;
  font-variant-ligatures: discretionary-ligatures;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;

  const cssOutputPath = `${PROJECT_PUBLIC}/spk.css`;
  await fs.writeFile(cssOutputPath, cssFileContent);
  const cssWrites = Buffer.byteLength(cssFileContent, 'utf8'); // Get byte length of string

  const compressedCss = zlib.gzipSync(Buffer.from(cssFileContent, 'utf8'));

  writtenCssSize = cssWrites;
  compressedCssSize = compressedCss.length;
};

const textMateSnippet = async (GLYPH_MAP: Record<string, [string, string]>) => {
  const iconsSnippetContent = `
  {
    "Phosphor icons": {
      "prefix": ["pp:icon"],
      "scope": "javascript,typescript,html",
      "body": "\${1|${Object.keys(GLYPH_MAP).join(',')}|}",
      "description": "Add a phosphor icon"
    },
    "Sparkle spk-icon": {
      "prefix": ["spk-icon"],
      "scope": "html",
      "body": "<spk-icon>\${1|${Object.keys(GLYPH_MAP).join(',')}|}</spk-icon>",
      "description": "Add a sparkle phosphor icon"
    }
  }
  `;

  // Ensure the .vscode directory exists
  const vscodeDir = './.vscode';
  await fs.mkdir(vscodeDir, { recursive: true });
  await fs.writeFile('./.vscode/html.code-snippets', iconsSnippetContent);
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const main = async (values: InputArguments) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TARGET_FONT_TYPE: SupportedFontTypes = 'woff2';
  const packageJsonPath = resolve(__dirname, '../../package.json'); // Use __dirname
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8')); // Read and parse package.json
  const PROJECT_SRC = values.src;
  const PROJECT_PUBLIC = values.out;
  const fontVariants = ['bold', 'thin', 'light', 'fill', 'regular'];

  // Ensure PROJECT_PUBLIC directory exists
  await fs.mkdir(PROJECT_PUBLIC, { recursive: true });

  const GLYPH_MAPS = await Promise.all(
    fontVariants.map(async (fontVariant) => {
      const selectionJsonFullPath = path.resolve(
        process.cwd(),
        'node_modules',
        '@phosphor-icons',
        'web',
        'src',
        fontVariant,
        'selection.json'
      );
      const selectionJson = JSON.parse(await fs.readFile(selectionJsonFullPath, 'utf8'));

      return getUnicodeObject(selectionJson.icons);
    })
  );

  const GLYPH_MAP = GLYPH_MAPS.reduce(
    (acc, curr) => {
      return {
        ...acc,
        ...curr,
      };
    },
    {} as Record<string, [string, string]>
  );

  const LIB_ICONS = packageJson.libraryIcons as string[];
  let watchers: any[] = [];

  await textMateSnippet(GLYPH_MAP); // Call with await

  if (values.watch) {
    const excludeFolders = ['node_modules', '.git', '.vscode', 'bin', 'assets'].concat([PROJECT_PUBLIC]);
    const watcher = watch(PROJECT_SRC, { recursive: true }, (_, filename) => {
      if (filename && !excludeFolders.some((folder) => resolve(join(PROJECT_SRC, filename)).includes(folder))) {
        run(PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
      }
    });

    watchers.push(watcher);
  }

  if (values.watchLib) {
    const watcher = watch(packageJsonPath, {}, async (_, filename) => {
      const updatedPackageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const newLibIcons = updatedPackageJson.libraryIcons as string[];

      run(PROJECT_SRC, newLibIcons, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
    });

    watchers.push(watcher);
  }

  await run(PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);

  if (values.watch) {
    process.on('SIGINT', killWatchers);
    process.on('SIGTERM', killWatchers);
    process.on('SIGBREAK', killWatchers);
  }
  function killWatchers() {
    console.log(`✅ The icon font generation watch process has been stopped.`);

    for (const watcher of watchers) {
      watcher.close();
    }

    process.exit(0);
  }
};
