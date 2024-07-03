#!/usr/bin/env bun

import { Glob } from 'bun';
import { resolve } from 'path';
import subsetFont from 'subset-font';
import { mapUnicodesToGlyphs } from './prep-font';

type SupportedFontTypes = 'woff' | 'woff2' | 'ttf';
export type InputArguments = {
  src: string;
  out: string;
  rootPath?: string;
};

console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);

export const main = async (values: InputArguments) => {
  const startTime = performance.now();
  const LIB_SRC = resolve(import.meta.dir, '../../lib');
  const PROJECT_SRC = values.src; //'./projects/design-system/src';
  const PROJECT_PUBLIC = values.out; //'./projects/design-system/public';
  const TARGET_FONT_TYPE: SupportedFontTypes = 'woff2' as SupportedFontTypes;

  function formatFileSize(bytes: number, dm = 2) {
    if (bytes == 0) return '0 Bytes';

    const k = 1000;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const glob = new Glob('**/*.html');
  const tsGlob = new Glob('**/*.ts');
  const regex = /<mat-icon[^>]*>((?!{{.*?}})[^<]*)<\/mat-icon>/g;
  // const regex = /<mat-icon[^>]*fontIcon="([^"]*)"/g;
  // <mat-icon fontIcon="compass" />
  const regex2 = /ppicon:([^']+)/g;
  // Any ts file containing ppicon:ICON_NAME

  const iconsFound = new Set<string>();

  for await (const SRC of [PROJECT_SRC, LIB_SRC]) {
    for await (const file of glob.scan(`${SRC}`)) {
      const fileText = await Bun.file(`${SRC}/${file}`).text();
      const matches = Array.from((fileText as any).matchAll(regex), (m: string) => m[1]);

      if (matches?.length) {
        for (let index = 0; index < matches.length; index++) {
          if (matches[index]) {
            iconsFound.add(matches[index]);
          }
        }
      }
    }

    for await (const file of tsGlob.scan(`${SRC}`)) {
      const fileText = await Bun.file(`${SRC}/${file}`).text();
      const matches = Array.from((fileText as any).matchAll(regex2), (m: string) => m[1]);

      if (matches?.length) {
        for (let index = 0; index < matches.length; index++) {
          if (matches[index]) {
            iconsFound.add(matches[index]);
          }
        }
      }
    }
  }

  // const glyphMap = await Bun.file(`${import.meta.dir}/config/glyphs.json`).json();

  const cssText = await Bun.file(`${import.meta.dir}/config/style.css`).text();
  const fontArrayBuffer = await Bun.file(`${import.meta.dir}/config/Phosphor.ttf`).arrayBuffer();

  const glyphMap = mapUnicodesToGlyphs(cssText);
  const fontBuffer = Buffer.from(fontArrayBuffer);
  const missingIcons = new Set<string>();

  const iconsAsGlyphs = Array.from(iconsFound)
    .map((icon) => {
      const glyph = glyphMap[icon];

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

  const targetFormat = (TARGET_FONT_TYPE as SupportedFontTypes) === 'ttf' ? 'truetype' : TARGET_FONT_TYPE;
  // Create a new font with only the characters required to render "Hello, world!" in WOFF format:
  const subsetBuffer = await subsetFont(fontBuffer, [...iconsAsGlyphs, ...iconsFound].join(''), {
    targetFormat,
    noLayoutClosure: true,
  } as any);

  // Create new font

  console.log(iconsFound);

  // Create a new css file
  const cssFileContent = `
@font-face {
  font-family: 'phb';
  src: url('${values.rootPath}phb.${TARGET_FONT_TYPE}') format('${TARGET_FONT_TYPE}');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.phb {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: "phb" !important;
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
  // OLD
  // {
  //   "Phospher mat-icon": {
  //     "prefix": ["pbh", "icon", "mat-icon"],
  //     "body": "<mat-icon fontIcon=\\"\${1|${allIcons.join(',')}|}\\" />",
  //     "description": "Add a material phoshor icon"
  //   }
  // }
  const iconsSnippetContent = `
{
  "Phospher mat-icon": {
    "prefix": ["pbh", "icon", "mat-icon"],
    "body": "<mat-icon>\${1|${Object.keys(glyphMap).join(',')}|}</mat-icon>",
    "description": "Add a material phoshor icon"
  }
}
`;

  const fontWrites = await Bun.write(`${PROJECT_PUBLIC}/phb.${TARGET_FONT_TYPE}`, subsetBuffer);
  const cssWrites = await Bun.write(`${PROJECT_PUBLIC}/phb.css`, cssFileContent);
  const iconsTsWrites = await Bun.write('./.vscode/html.code-snippets', iconsSnippetContent);

  const endTime = performance.now();
  const runtime = endTime - startTime;

  const compressedFont = Bun.gzipSync(subsetBuffer);
  const compressedCss = Bun.gzipSync(cssFileContent);
  console.log('Generated font file size: ', formatFileSize(fontWrites));
  console.log('Generated css file size: ', formatFileSize(cssWrites));
  console.log('Generated total file size: ', formatFileSize(fontWrites + cssWrites));
  console.log('Generated compressed font file size: ', formatFileSize(compressedFont.length));
  console.log('Generated compressed css file size: ', formatFileSize(compressedCss.length));
  console.log('Generated total compressed file size: ', formatFileSize(compressedFont.length + compressedCss.length));
  console.log('Generated types file size: ', formatFileSize(iconsTsWrites));
  console.log('Time taken: ', runtime.toFixed(2) + 'ms');
  console.log(' ');
};
