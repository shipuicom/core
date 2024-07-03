import { UnicodeRange } from '@japont/unicode-range';

// Util to handle passing unicode-range as a string
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

export const mapUnicodesToGlyphs = (cssText: string) => {
  let glyphMap: Record<string, string> = {};
  const pattern = /\.ph\.ph-([a-z-]+):before\s*{[^}]*content:\s*"\\([0-9a-z]+)";/g; // Global flag for multiple matches
  const matches = Array.from(cssText.matchAll(pattern));

  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];

    glyphMap[match[1]] = getGlyphsFromUnicodeRange('U+' + match[2])[0];
  }

  return glyphMap;
};


export function formatFileSize(bytes: number, dm = 2) {
  if (bytes == 0) return '0 Bytes';

  const k = 1000;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
