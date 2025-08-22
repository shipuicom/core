import { promises as fs, watch } from 'fs';
import { glob } from 'glob';
import path, { join, resolve } from 'path';
import { performance } from 'perf_hooks';
import zlib from 'zlib';

import subsetFont from 'subset-font';

import { fileURLToPath } from 'url';
import { formatFileSize, getUnicodeObject } from './utilities.js';

let writtenCssSize = 0;
let compressedCssSize = 0;

const run = async (PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values) => {
  const startTime = performance.now();

  const regex = /<sh-icon[^>]*>\s*((?!{{.*?}})[^<]*?)\s*<\/sh-icon>/g;
  const regex2 = /shicon:([^']+)/g;
  const iconsFound = new Set(LIB_ICONS);
  const missingIcons = new Set();

  const htmlFiles = await glob('**/*.html', { cwd: PROJECT_SRC });
  for (const file of htmlFiles) {
    const fileText = await fs.readFile(join(PROJECT_SRC, file), 'utf8');
    const matches = Array.from(fileText.matchAll(regex), (m) => m[1]);

    if (matches?.length) {
      for (const match of matches) {
        if (match) iconsFound.add(match);
      }
    }
  }

  const tsFiles = await glob('**/*.ts', { cwd: PROJECT_SRC });

  for (const file of tsFiles) {
    const fileText = await fs.readFile(join(PROJECT_SRC, file), 'utf8');
    const matches = Array.from(fileText.matchAll(regex2), (m) => m[1]);

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
      const duotone = icon.endsWith('-duotone');
      const regular = !bold && !thin && !light && !fill && !duotone;
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
      if (duotone) {
        acc['duotone'].push([icon, '']);
        acc['duotone'].push(glyph);
      }

      return acc;
    },
    {
      bold: [],
      thin: [],
      light: [],
      fill: [],
      regular: [],
      duotone: [],
      text: [],
    }
  );

  const missingIconsArray = Array.from(missingIcons);

  if (missingIconsArray.length) {
    console.log('Following icons does not exist in font: \n ', missingIconsArray);
  }

  await writeCssFile(PROJECT_PUBLIC, values, groupedIcons, TARGET_FONT_TYPE);

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
    });

    return subsetBuffer;
  });

  const _fonts = await Promise.all(fonts);
  let totalFontSize = 0;
  let totalCompressedFontSize = 0;

  for (let i = 0; i < _fonts.length; i++) {
    const subsetBuffer = _fonts[i];
    const fontType = fontTypes[i];
    const outputPath = `${PROJECT_PUBLIC}/sh${fontType === 'regular' ? '' : '-' + fontType}.${TARGET_FONT_TYPE}`;

    await fs.writeFile(outputPath, subsetBuffer);
    const fontWrites = subsetBuffer.length;

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

function uniqueString(s) {
  const seen = new Set();
  let result = '';

  for (const char of s) {
    if (!seen.has(char)) {
      seen.add(char);
      result += char;
    }
  }
  return result;
}

const writeCssFile = async (PROJECT_PUBLIC, values, groupedIcons, TARGET_FONT_TYPE = 'woff2') => {
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

  const cssOutputPath = `${PROJECT_PUBLIC}/ship.css`;
  await fs.writeFile(cssOutputPath, cssFileContent);
  const cssWrites = Buffer.byteLength(cssFileContent, 'utf8');

  const compressedCss = zlib.gzipSync(Buffer.from(cssFileContent, 'utf8'));

  writtenCssSize = cssWrites;
  compressedCssSize = compressedCss.length;
};

const textMateSnippet = async (GLYPH_MAP) => {
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

  const vscodeDir = './.vscode';
  await fs.mkdir(vscodeDir, { recursive: true });
  await fs.writeFile('./.vscode/html.code-snippets', iconsSnippetContent);
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const main = async (values) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TARGET_FONT_TYPE = 'woff2';
  const packageJsonPath = resolve(__dirname, '../../package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  const PROJECT_SRC = values.src;
  const PROJECT_PUBLIC = values.out;
  const fontVariants = ['bold', 'thin', 'light', 'fill', 'regular'];

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
      const unicodeObj = getUnicodeObject(selectionJson.icons, fontVariant === 'duotone');

      return unicodeObj;
    })
  );

  const GLYPH_MAP = GLYPH_MAPS.reduce((acc, curr) => {
    return {
      ...acc,
      ...curr,
    };
  }, {});

  const LIB_ICONS = packageJson.libraryIcons;
  let watchers = [];

  await textMateSnippet(GLYPH_MAP);

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
      const newLibIcons = updatedPackageJson.libraryIcons;

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
