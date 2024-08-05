#!/usr/bin/env bun

import { Glob } from 'bun';
import { watch } from 'fs';
import { join, resolve } from 'path';
import subsetFont from 'subset-font';
import { formatFileSize, mapUnicodesToGlyphs } from './utilities';

type SupportedFontTypes = 'woff' | 'woff2' | 'ttf';
export type InputArguments = {
  src: string;
  out: string;
  rootPath: string;
  watch: boolean;
  watchLib: boolean;
  verbose: boolean;
};

let writtenCssSize = 0;
let compressedCssSize = 0;

const run = async (
  PROJECT_SRC: string,
  LIB_ICONS: string[],
  PROJECT_PUBLIC: string,
  GLYPH_MAP: Record<string, string>,
  TARGET_FONT_TYPE: SupportedFontTypes,
  values: InputArguments
) => {
  const startTime = performance.now();

  const glob = new Glob('**/*.html');
  const tsGlob = new Glob('**/*.ts');
  const regex = /<spk-icon[^>]*>((?!{{.*?}})[^<]*)<\/spk-icon>/g;
  const regex2 = /ppicon:([^']+)/g;
  const iconsFound = new Set<string>(LIB_ICONS);
  const missingIcons = new Set<string>();

  for await (const file of glob.scan(`${PROJECT_SRC}`)) {
    const fileText = await Bun.file(`${PROJECT_SRC}/${file}`).text();
    const matches = Array.from((fileText as any).matchAll(regex), (m: string) => m[1]);

    if (matches?.length) {
      for (let index = 0; index < matches.length; index++) {
        if (matches[index]) {
          iconsFound.add(matches[index]);
        }
      }
    }
  }

  for await (const file of tsGlob.scan(`${PROJECT_SRC}`)) {
    const fileText = await Bun.file(`${PROJECT_SRC}/${file}`).text();
    const matches = Array.from((fileText as any).matchAll(regex2), (m: string) => m[1]);

    if (matches?.length) {
      for (let index = 0; index < matches.length; index++) {
        if (matches[index]) {
          iconsFound.add(matches[index]);
        }
      }
    }
  }

  const iconsAsGlyphs = Array.from(iconsFound)
    .map((icon) => {
      const glyph = GLYPH_MAP[icon];

      if (!glyph) {
        missingIcons.add(icon);
        return undefined;
      }

      return glyph;
    })
    .filter((v) => v);

  const missingIconsArray = Array.from(missingIcons);

  if (missingIconsArray.length) {
    console.log('Following icons does not exist in font: \n ', Array.from(missingIcons));
  }

  // Create a new font with only the characters required to render "Hello, world!" in WOFF format:
  const fontArrayBuffer = await Bun.file(`${import.meta.dir}/config/Phosphor.ttf`).arrayBuffer();
  const targetFormat = (TARGET_FONT_TYPE as SupportedFontTypes) === 'ttf' ? 'truetype' : TARGET_FONT_TYPE;
  const iconsToBuild = new Set([...iconsAsGlyphs, ...iconsFound]);
  const subsetBuffer = await subsetFont(Buffer.from(fontArrayBuffer), Array.from(iconsToBuild).join(''), {
    targetFormat,
    noLayoutClosure: true,
  } as any);

  const fontWrites = await Bun.write(`${PROJECT_PUBLIC}/spk.${TARGET_FONT_TYPE}`, subsetBuffer);

  const endTime = performance.now();
  const runtime = endTime - startTime;

  const compressedFont = Bun.gzipSync(subsetBuffer);

  if (values.verbose) {
    console.log(iconsFound);
    console.log('Generated font file size: ', formatFileSize(fontWrites));
    console.log('Generated css file size: ', formatFileSize(writtenCssSize));
    console.log('Generated total file size: ', formatFileSize(fontWrites + writtenCssSize));
    console.log('Generated compressed font file size: ', formatFileSize(compressedFont.length));
    console.log('Generated compressed css file size: ', formatFileSize(compressedCssSize));
    console.log('Generated total compressed file size: ', formatFileSize(compressedFont.length + compressedCssSize));
    console.log('Time taken: ', runtime.toFixed(2) + 'ms');
  } else {
    console.log(
      `Font & CSS (Generated/Compressed size): ${formatFileSize(fontWrites + writtenCssSize)}/${formatFileSize(compressedFont.length + compressedCssSize)}`
    );
    console.log('Time taken: ', runtime.toFixed(2) + 'ms');
  }
  console.log(' ');
};

const writeCssFile = async (PROJECT_PUBLIC: string, values: InputArguments, TARGET_FONT_TYPE = 'woff2') => {
  // Create a new css file
  const cssFileContent = `
@font-face {
  font-family: 'spk';
  src: url('${values.rootPath}spk.${TARGET_FONT_TYPE}') format('${TARGET_FONT_TYPE}');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

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
}
`;
  const cssWrites = await Bun.write(`${PROJECT_PUBLIC}/spk.css`, cssFileContent);
  const compressedCss = Bun.gzipSync(cssFileContent);

  writtenCssSize = cssWrites;
  compressedCssSize = compressedCss.length;
};

const textMateSnippet = async (GLYPH_MAP: Record<string, string>) => {
  const iconsSnippetContent = `
  {
    "Phosphor icons": {
      "prefix": ["pp:icon"],
      "body": "\${1|${Object.keys(GLYPH_MAP).join(',')}|}",
      "description": "Add a phosphor icon"
    },
    "Sparkle spk-icon": {
      "prefix": ["spk-icon"],
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
  const cssText = await Bun.file(`${import.meta.dir}/config/style.css`).text();
  const GLYPH_MAP = mapUnicodesToGlyphs(cssText);

  const LIB_ICONS = packageJson.libraryIcons as string[];

  textMateSnippet(GLYPH_MAP);
  writeCssFile(PROJECT_PUBLIC, values, TARGET_FONT_TYPE);

  if (values.watch) {
    const excludeFolders = ['node_modules', '.git', '.vscode', 'bin', 'assets'].concat([PROJECT_PUBLIC]);
    watch(PROJECT_SRC, { recursive: true }, (_, filename) => {
      if (
        filename && // Ensure filename is provided (can be null in some cases)
        !excludeFolders.some((folder) => resolve(join(PROJECT_SRC, filename)).includes(folder))
      ) {
        run(PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
      }
    });
  }

  if (values.watchLib) {
    watch(packageJsonPath, {}, async (_, filename) => {
      const packageJson = await Bun.file(packageJsonPath).json();
      const newLibIcons = packageJson.libraryIcons as string[];

      run(PROJECT_SRC, newLibIcons, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
    });
  }

  run(PROJECT_SRC, LIB_ICONS, PROJECT_PUBLIC, GLYPH_MAP, TARGET_FONT_TYPE, values);
};
