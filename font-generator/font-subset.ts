import { UnicodeRange } from '@japont/unicode-range';
import { Glob } from 'bun';
import subsetFont from 'subset-font';
import packageJson from '../package.json';

type SupportedFontTypes = 'woff' | 'woff2' | 'ttf';

const startTime = performance.now();

const FONT_TYPE: 'Bold' | 'Regular' = 'Regular';
const PROJECT_SRC = './projects/design-system/src';
const PROJECT_PUBLIC = './projects/design-system/public';
const TARGET_FONT_TYPE: SupportedFontTypes = 'woff2' as SupportedFontTypes;

const extraIcons: string[] = (packageJson as any).extraIcons ?? [];

if (extraIcons.length) {
  throw new Error('extraIcons in package.json should be an array of strings');
}

// util to handle passing unicode-range as a string
function formatRange(range: any) {
  if (typeof range === 'string') {
    return range.replace(/\s*/g, '').split(',');
  }
  return range;
}

function getGlyphsFromUnicodeRange(range: any) {
  // UnicodeRange currently requires an array of ranges …
  const rangeArray = formatRange(range);

  const glyphs = UnicodeRange.parse(rangeArray).map((cp) => String.fromCodePoint(cp));

  return glyphs;
}

function formatFileSize(bytes: number, dm = 2) {
  if (bytes == 0) return '0 Bytes';

  const k = 1000;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const glob = new Glob('**/*.html');
const tsGlob = new Glob('**/*.ts');
const regex = /<mat-icon[^>]*>(.*?)<\/mat-icon>/g;
// const regex = /<mat-icon[^>]*fontIcon="([^"]*)"/g;
// <mat-icon fontIcon="compass" />
const regex2 = /ppicon:([^']+)/g;
// Any ts file containing ppicon:ICON_NAME

const preDefinedIcons = extraIcons;
const iconsFound = new Set<string>();

preDefinedIcons.forEach((icon) => iconsFound.add(icon));

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

const iconJson = await Bun.file(`${import.meta.dir}/_available-phosphor-icons.json`).text();
const fontArrayBuffer = await Bun.file(`${import.meta.dir}/fonts/Phosphor-${FONT_TYPE}.ttf`).arrayBuffer();
const fontBuffer = Buffer.from(fontArrayBuffer);

const iconJsonObj = JSON.parse(iconJson);

const missingIcons = new Set<string>();
const selectedUnicodes = Array.from(iconsFound)
  .map((iconName) => {
    if (!iconJsonObj[iconName]) {
      missingIcons.add(iconName);
      return undefined;
    }

    return 'U+' + iconJsonObj[iconName].toUpperCase();
  })
  .filter((v) => v);

const allIcons = Object.keys(iconJsonObj).filter((i) => !i.startsWith('__') && !i.endsWith('__'));

const missingIconsArray = Array.from(missingIcons);

if (missingIconsArray.length) {
  console.log('Following icons does not exist in font: \n ', Array.from(missingIcons));
}

const glyphs = getGlyphsFromUnicodeRange(selectedUnicodes);

// console.log(glyphs);

const targetFormat = (TARGET_FONT_TYPE as SupportedFontTypes) === 'ttf' ? 'truetype' : TARGET_FONT_TYPE;
// Create a new font with only the characters required to render "Hello, world!" in WOFF format:
const subsetBuffer = await subsetFont(fontBuffer, [...glyphs, ...iconsFound].join(''), {
  targetFormat,
  noLayoutClosure: true,
} as any);

// Create new font

console.log(iconsFound);

// Create a new css file
const cssFileContent = `
@font-face {
  font-family: 'phb';
  src: url('/phb-${FONT_TYPE}.${TARGET_FONT_TYPE}') format('${TARGET_FONT_TYPE}');
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
    "body": "<mat-icon>\${1|${allIcons.join(',')}|}</mat-icon>",
    "description": "Add a material phoshor icon"
  }
}
`;
// declare (property) MatIcon.fontIcon: ;

// console.log(iconsSnippetContent);

const fontWrites = await Bun.write(`${PROJECT_PUBLIC}/phb-${FONT_TYPE}.${TARGET_FONT_TYPE}`, subsetBuffer);
const cssWrites = await Bun.write(`${PROJECT_PUBLIC}/phb.css`, cssFileContent);
const iconsTsWrites = await Bun.write('./.vscode/html.code-snippets', iconsSnippetContent);
// console.log(cssFileContent);

const endTime = performance.now();
const runtime = endTime - startTime;
// console.log('subsetBuffer: ', subsetBuffer);
console.log('Generated font file size: ', formatFileSize(fontWrites));
console.log('Generated css file size: ', formatFileSize(cssWrites));
console.log('Generated types file size: ', formatFileSize(iconsTsWrites));
console.log('Time taken: ', runtime.toFixed(2) + 'ms');
console.log(' ');
