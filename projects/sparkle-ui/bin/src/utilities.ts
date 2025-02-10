// export function createNameCodeObject(jsonData: Item[]): Record<string, string> {
//   const nameCodeObject: Record<string, string> = {};

//   for (let i = 0; i < jsonData.length; i++) {
//     const item = jsonData[i];
//     nameCodeObject[item.properties.name] = getGlyphsFromUnicodeRange('U+' + item.properties.code)[0];
//   }

//   return nameCodeObject;
// }

export function createNameCodeObject(jsonData: Item[]): Record<string, string> {
  const nameCodeObject: Record<string, string> = {};

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];
    const hexCode = item.properties.code.toString(16); // Convert decimal to hex
    const codePoint = parseInt(hexCode, 16); // Parse hex to integer code point
    const glyph = String.fromCodePoint(codePoint); // Create the glyph
    nameCodeObject[item.properties.ligatures] = glyph;
  }

  return nameCodeObject;
}

export const getUnicodeObject = (jsonData: Item[]): Record<string, [string, string]> => {
  const nameCodeObject: Record<string, [string, string]> = {};

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];
    const hexCode = item.properties.code.toString(16); // Convert decimal to hex
    const codePoint = parseInt(hexCode, 16); // Parse hex to integer code point
    const glyph = String.fromCodePoint(codePoint); // Create the glyph
    if (glyph === '') {
      console.warn(`Invalid codepoint 0x${hexCode} for ligature ${item.properties.ligatures}`);
      continue;
    }
    nameCodeObject[item.properties.ligatures] = [glyph, 'U+' + hexCode];
  }

  return nameCodeObject;
};

export const createCodepointObject = (jsonData: Item[]): Record<string, number> => {
  const nameCodeObject: Record<string, number> = {};

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];

    nameCodeObject[item.properties.ligatures] = item.properties.code;
  }

  return nameCodeObject;
};

export function formatFileSize(bytes: number, dm = 2) {
  if (bytes == 0) return '0 Bytes';

  const k = 1000;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface Icon {
  paths: string[];
  attrs: { fill: string; opacity?: number }[];
  isMulticolor: boolean;
  isMulticolor2: boolean;
  colorPermutations: { [key: string]: { f: number }[] };
  tags: string[];
  grid: number;
}

interface Attributes {
  fill: string;
  opacity?: number;
}

interface Properties {
  id: number;
  order: number;
  name: string;
  ligatures: string;
  code: number;
  prevSize: number;
  codes: boolean;
}

interface Item {
  icon: Icon;
  attrs: Attributes[];
  properties: Properties;
  setIdx: number;
  setId: number;
  iconIdx: number;
}

export type SupportedFontTypes = 'woff' | 'woff2' | 'ttf';

export type InputArguments = {
  src: string;
  out: string;
  rootPath: string;
  watch: boolean;
  watchLib: boolean;
  verbose: boolean;
};
