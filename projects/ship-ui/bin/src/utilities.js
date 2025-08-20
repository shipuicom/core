export function createNameCodeObject(jsonData) {
  const nameCodeObject = {};

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];
    const hexCode = item.properties.code.toString(16);
    const codePoint = parseInt(hexCode, 16);
    const glyph = String.fromCodePoint(codePoint);
    nameCodeObject[item.properties.ligatures] = glyph;
  }

  return nameCodeObject;
}

export const getUnicodeObject = (jsonData, isDuotone) => {
  const nameCodeObject = {};

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];
    const hexCode = item.properties.code.toString(16);
    const codePoint = parseInt(hexCode, 16);
    const glyph = String.fromCodePoint(codePoint);
    if (glyph === '') {
      console.warn(`Invalid codepoint 0x${hexCode} for ligature ${item.properties.ligatures}`);
      continue;
    }

    const glyphName = isDuotone ? item.properties.name : item.properties.ligatures;
    nameCodeObject[glyphName] = [glyph, 'U+' + hexCode];
  }

  return nameCodeObject;
};

export const createCodepointObject = (jsonData) => {
  const nameCodeObject = {};

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];

    nameCodeObject[item.properties.ligatures] = item.properties.code;
  }

  return nameCodeObject;
};

export function formatFileSize(bytes, dm = 2) {
  if (bytes == 0) return '0 Bytes';

  const k = 1000;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
