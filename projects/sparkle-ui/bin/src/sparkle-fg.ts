#!/usr/bin/env bun

import { Glob } from 'bun';
import { FSWatcher, watch } from 'fs';
import { join, resolve } from 'path';

import subsetFont from 'subset-font';
import { formatFileSize, getUnicodeObject, InputArguments, SupportedFontTypes } from './utilities';

let writtenCssSize = 0;
let compressedCssSize = 0;

const run = async (
  PROJECT_SRC: string,
  LIB_ICONS: string[],
  PROJECT_PUBLIC: string,
  GLYPH_MAP: Record<string, [string, string]>,
  TARGET_FONT_TYPE: SupportedFontTypes,
  values: InputArguments
) => {
  const startTime = performance.now();

  const glob = new Glob('**/*.html');
  const tsGlob = new Glob('**/*.ts');
  const regex = /<spk-icon[^>]*>\s*((?!{{.*?}})[^<]*?)\s*<\/spk-icon>/g;
  const regex2 = /ppicon:([^']+)/g;
  const iconsFound = new Set<string>(LIB_ICONS);
  const missingIcons = new Set<string>();

  for await (const file of glob.scan(`${PROJECT_SRC}`)) {
    const fileText = await Bun.file(`${PROJECT_SRC}/${file}`).text();
    const matches = Array.from((fileText as any).matchAll(regex), (m: string) => m[1]);

    if (matches?.length) {
      for (let index = 0; index < matches.length; index++) {
        const match = matches[index];

        if (match) iconsFound.add(match);
      }
    }
  }

  for await (const file of tsGlob.scan(`${PROJECT_SRC}`)) {
    const fileText = await Bun.file(`${PROJECT_SRC}/${file}`).text();
    const matches = Array.from((fileText as any).matchAll(regex2), (m: string) => m[1]);

    if (matches?.length) {
      for (let index = 0; index < matches.length; index++) {
        const match = matches[index];

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
    console.log('Following icons does not exist in font: \n ', Array.from(missingIcons));
  }

  writeCssFile(PROJECT_PUBLIC, values, groupedIcons, TARGET_FONT_TYPE);

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // We dont load fonts we dont use
  const fontTypes = ['bold', 'thin', 'light', 'fill', 'regular'].filter((x) => groupedIcons[x].length > 0);
  const targetFormat = (TARGET_FONT_TYPE as SupportedFontTypes) === 'ttf' ? 'truetype' : TARGET_FONT_TYPE;
  const fonts = fontTypes.map(async (fontType) => {
    const glyphs = uniqueString(groupedIcons[fontType].map((icon) => icon[0]).join(''));
    const arrayBuffer = await Bun.file(
      `${import.meta.dir}/config/${fontType}/Phosphor${fontType === 'regular' ? '' : '-' + capitalize(fontType)}.${TARGET_FONT_TYPE}`
    ).arrayBuffer();

    const subsetBuffer = await subsetFont(Buffer.from(arrayBuffer), glyphs, {
      targetFormat,
      noLayoutClosure: true,
    } as any);

    return subsetBuffer;
  });

  const _fonts = await Promise.all(fonts);
  let totalFontSize = 0;
  let totalCompressedFontSize = 0;

  for (let i = 0; i < _fonts.length; i++) {
    const subsetBuffer = _fonts[i];
    const fontType = fontTypes[i];
    const fontWrites = await Bun.write(
      `${PROJECT_PUBLIC}/spk${fontType === 'regular' ? '' : '-' + fontType}.${TARGET_FONT_TYPE}`,
      subsetBuffer
    );

    const compressedFont = Bun.gzipSync(subsetBuffer);
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
  const seen = new Set<string>(); // Use a Set to track seen characters
  let result = '';

  for (const char of s) {
    if (!seen.has(char)) {
      // Check if the character has been seen
      seen.add(char); // Add the character to the seen set
      result += char; // Append the character to the result
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
  // Create a new css file
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
  const cssWrites = await Bun.write(`${PROJECT_PUBLIC}/spk.css`, cssFileContent);
  const compressedCss = Bun.gzipSync(cssFileContent);

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

  await Bun.write('./.vscode/html.code-snippets', iconsSnippetContent);
};

export const main = async (values: InputArguments) => {
  const TARGET_FONT_TYPE: SupportedFontTypes = 'woff2' as SupportedFontTypes;
  const packageJsonPath = resolve(import.meta.dir, '../../package.json');
  const packageJson = await Bun.file(packageJsonPath).json();
  const PROJECT_SRC = values.src;
  const PROJECT_PUBLIC = values.out;
  const fontVariants = ['bold', 'thin', 'light', 'fill', 'regular'];
  const GLYPH_MAPS = await Promise.all(
    fontVariants.map(async (fontVariant) => {
      const selectionJson = await Bun.file(`${import.meta.dir}/config/${fontVariant}/selection.json`).json();

      // return createCodepointObject(selectionJson.icons);
      // return createNameCodeObject(selectionJson.icons);
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
  let watchers: FSWatcher[] = [];

  textMateSnippet(GLYPH_MAP);

  if (values.watch) {
    const excludeFolders = ['node_modules', '.git', '.vscode', 'bin', 'assets'].concat([PROJECT_PUBLIC]);
    const watcher = watch(PROJECT_SRC, { recursive: true }, (_, filename) => {
      if (
        filename && // Ensure filename is provided (can be null in some cases)
        !excludeFolders.some((folder) => resolve(join(PROJECT_SRC, filename)).includes(folder))
      ) {
        run(PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
      }
    });

    watchers.push(watcher);
  }

  if (values.watchLib) {
    const watcher = watch(packageJsonPath, {}, async (_, filename) => {
      const packageJson = await Bun.file(packageJsonPath).json();
      const newLibIcons = packageJson.libraryIcons as string[];

      run(PROJECT_SRC, newLibIcons, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
    });

    watchers.push(watcher);
  }

  run(PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);

  process.on('SIGKILL', killWatchers);
  process.on('SIGINT', killWatchers);
  process.on('SIGTERM', killWatchers);
  process.on('SIGBREAK', killWatchers);

  function killWatchers() {
    console.log(`✅ The icon font generation watch process has been stopped.`);

    setTimeout(() => {
      watchers.forEach((watcher) => watcher.close());
      process.exit(0);
    }, 100);
  }
};
